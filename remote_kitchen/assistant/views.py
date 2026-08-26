import math
import operator
import re
from functools import reduce

from django.db.models import Q
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from restaurants.models import Menu, Restaurant

STOPWORDS = {
    "a", "an", "the", "i", "me", "my", "we", "you", "your", "us", "is", "are",
    "do", "does", "have", "has", "had", "and", "or", "for", "from", "want",
    "wanna", "would", "like", "looking", "need", "get", "give", "show", "find",
    "where", "what", "which", "can", "could", "please", "some", "one", "at",
    "in", "on", "near", "closest", "nearest", "close", "nearby", "there", "any",
    "dishes", "dish", "food", "items", "item", "menu", "restaurant",
    "restaurants", "available", "serve", "serves", "offer", "offers", "know",
    "about", "tell", "much", "how", "does", "cost", "price", "priced", "under",
    "over", "less", "than", "best", "good", "great", "recommend",
    "recommendation", "recommendations", "suggestion", "suggestions",
    "suggest", "veggie", "vegetarian", "vegan", "meatless", "today", "night",
    "lunch", "dinner", "cheap", "hot", "fresh", "with", "without",
    "something", "anything", "everything", "nothing", "maybe", "just",
    "prefer", "preferred", "craving", "order", "ordering", "delicious",
    "tasty", "yummy", "whats", "whats", "whats", "im", "ive", "youre",
    "theres", "here", "around", "try", "trying", "eat", "eats", "eating",
    "drink", "drinks", "new", "popular", "our", "their", "them", "these",
    "those", "this", "that", "all", "only",
}

VEG_PATTERNS = [
    r"\bveg\b",
    r"vegetarian",
    r"veggie",
    r"vegan",
    r"meatless",
    r"no\s*meat",
    r"plant\s*based",
]

PRICE_PATTERNS = [
    r"under\s*\$?\s*(\d+(?:\.\d+)?)",
    r"less\s*than\s*\$?\s*(\d+(?:\.\d+)?)",
    r"<\s*\$?\s*(\d+(?:\.\d+)?)",
    r"\$?\s*(\d+(?:\.\d+)?)\s*or\s*less",
]

# Address words that should not be treated as a "place" name.
_STREET_WORDS = {
    "street", "st", "lane", "ln", "road", "rd", "avenue", "ave", "boulevard",
    "blvd", "drive", "dr", "way", "court", "ct", "place", "pl", "suite", "apt",
    "elm", "curry", "pier",
}


def _haversine_km(lat1, lng1, lat2, lng2):
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = (
        math.sin(dp / 2) ** 2
        + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(a))


def _is_veg(text):
    return any(re.search(p, text) for p in VEG_PATTERNS)


def _extract_price(text):
    for pattern in PRICE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            try:
                return float(match.group(1))
            except (TypeError, ValueError):
                return None
    return None


def _keywords(text, exclude=None):
    exclude = exclude or set()
    words = re.findall(r"[a-z']+", text)
    # Normalize apostrophes ("what's" -> "whats"), drop pure numbers (handled
    # by price detection) and filler words.
    return [
        w.replace("'", "")
        for w in words
        if w.replace("'", "") not in STOPWORDS
        and w.replace("'", "") not in exclude
        and len(w.replace("'", "")) > 1
        and not w.replace("'", "").isdigit()
    ]


def _detect_place(text):
    """Restrict to restaurants whose address mentions a token from the query."""
    tokens = set(re.findall(r"[a-z]+", text))
    tokens = {
        t
        for t in tokens
        if len(t) > 2 and t not in _STREET_WORDS and t not in STOPWORDS
    }
    if not tokens:
        return None, set()
    matched_tokens = set()
    matched = []
    for r in Restaurant.objects.all():
        hit = {t for t in tokens if t in r.address.lower()}
        if hit:
            matched.append(r)
            matched_tokens.update(hit)
    return (matched or None), matched_tokens


def _build_item(menu, distance_km):
    return {
        "menu_id": menu.id,
        "name": menu.name,
        "description": menu.description,
        "price": str(menu.price),
        "is_vegetarian": menu.is_vegetarian,
        "restaurant_id": menu.restaurant_id,
        "restaurant_name": menu.restaurant.name,
        "restaurant_address": menu.restaurant.address,
        "distance_km": distance_km,
    }


class AssistantQueryView(APIView):
    """Natural-language dish/restaurant assistant backed by the menu database."""

    permission_classes = [AllowAny]

    def post(self, request):
        q = (request.data.get("q") or "").strip()
        raw_lat = request.data.get("lat")
        raw_lng = request.data.get("lng")

        if not q:
            return Response(
                {
                    "message": (
                        "Hi, I'm the Kitchen Assistant! Ask me for a dish, a "
                        "cuisine, or the closest restaurant serving what you crave."
                    ),
                    "items": [],
                    "needs_location": False,
                    "suggestions": [
                        "Which restaurant has pizza?",
                        "I want something vegetarian",
                        "Find butter chicken nearby",
                        "Closest restaurant with pasta",
                        "What's under $15?",
                    ],
                }
            )

        text = q.lower()

        ref_point = None
        if raw_lat is not None and raw_lng is not None:
            try:
                ref_point = (float(raw_lat), float(raw_lng))
            except (TypeError, ValueError):
                ref_point = None

        want_closest = any(
            k in text
            for k in ("closest", "nearest", "nearby", "near me", "close to")
        )

        place_restaurants, place_tokens = _detect_place(text)

        queryset = Menu.objects.select_related("restaurant").filter(
            is_available=True
        )
        if place_restaurants:
            queryset = queryset.filter(
                restaurant__in=place_restaurants
            )

        if _is_veg(text):
            queryset = queryset.filter(is_vegetarian=True)

        price_max = _extract_price(text)
        if price_max is not None:
            queryset = queryset.filter(price__lte=price_max)

        keywords = _keywords(text, exclude=place_tokens)
        if keywords:
            clauses = [
                Q(name__icontains=k) | Q(description__icontains=k)
                for k in keywords
            ]
            narrowed = queryset.filter(
                reduce(operator.and_, clauses)
            )
            if narrowed.exists():
                queryset = narrowed
            else:
                queryset = queryset.filter(reduce(operator.or_, clauses))

        items = list(queryset.distinct()[:12])

        payload_items = []
        for menu in items:
            distance_km = None
            if ref_point and menu.restaurant.latitude and menu.restaurant.longitude:
                distance_km = round(
                    _haversine_km(
                        ref_point[0],
                        ref_point[1],
                        menu.restaurant.latitude,
                        menu.restaurant.longitude,
                    ),
                    2,
                )
            payload_items.append(_build_item(menu, distance_km))

        if ref_point:
            payload_items.sort(
                key=lambda it: (
                    it["distance_km"] is None,
                    it["distance_km"] or 0,
                )
            )

        needs_location = bool(want_closest and not ref_point)
        message = self._compose_message(
            q, items, payload_items, want_closest, ref_point, place_restaurants
        )
        suggestions = self._suggestions()

        return Response(
            {
                "message": message,
                "items": payload_items,
                "needs_location": needs_location,
                "suggestions": suggestions,
            }
        )

    def _compose_message(
        self, q, items, payload_items, want_closest, ref_point, place_restaurants
    ):
        if not items:
            return (
                f"I couldn't find anything matching '{q}'. Try a dish name, "
                "ingredient, dietary preference, or ask 'what's under $15?'."
            )

        count = len(items)
        if want_closest and ref_point:
            closest = payload_items[0]
            return (
                f"Found {count} match{'es' if count != 1 else ''}. "
                f"The closest option is {closest['name']} at "
                f"{closest['restaurant_name']} "
                f"({closest['distance_km']} km away)."
            )
        if want_closest:
            return (
                f"Found {count} match{'es' if count != 1 else ''}. Share your "
                "location and I'll tell you which one is closest."
            )
        if place_restaurants:
            names = ", ".join(r.name for r in place_restaurants)
            return (
                f"I found {count} matching dish{'es' if count != 1 else ''} "
                f"at {names}:"
            )
        return (
            f"I found {count} matching dish{'es' if count != 1 else ''}:"
        )

    def _suggestions(self):
        return [
            "Which restaurant has pizza?",
            "I want something vegetarian",
            "Closest restaurant with pasta",
            "What's under $15?",
            "Show me butter chicken",
        ]
