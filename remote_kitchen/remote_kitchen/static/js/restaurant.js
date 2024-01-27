

const createRestaurant = document.getElementById('create-restaurant-form')


createRestaurant.addEventListener('submit', function (event) {
    event.preventDefault();

    var formData = new FormData(this);

    fetch('api/create/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: formData.get('name'),
            address: formData.get('address'),
        }),
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result-message').innerText = 'Restaurant created successfully!';
            fetchUserRestaurants();
            createRestaurant.reset();
        })
        .catch(error => {
            document.getElementById('result-message').innerText = 'Error creating restaurant.';
            console.error('Error:', error);
        });
});


function fetchUserRestaurants() {
    fetch('api/restaurants/')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('userRestaurantsTable').getElementsByTagName('tbody')[0];
            // Clear existing rows before updating
            tableBody.innerHTML = '';
            data.forEach(restaurant => {
                const row = tableBody.insertRow(-1);
                const cell1 = row.insertCell(0);
                const cell2 = row.insertCell(1);
                const cell3 = row.insertCell(2);
                const cell4 = row.insertCell(3);
                // Populate cells with data from the API response
                cell1.innerHTML = restaurant.name;
                cell2.innerHTML = restaurant.address;
                cell3.innerHTML = restaurant.created_at;
                cell4.innerHTML = `<a type="button" href="/restaurants/${restaurant.id}" class="btn btn-info m-2"><i class="fas fa-edit"></i></a> <button type="button" class="btn btn-danger m-2" onclick=deleteRestaurant(${restaurant.id}) ><i class="fas fa-trash"></i></button>`
                // Add more cells as needed
            });
        })
        .catch(error => console.error('Error fetching user restaurants:', error));
}



fetchUserRestaurants();

function deleteRestaurant(restaurantId) {
    const csrftoken = getCookie('csrftoken');
    fetch(`/restaurants/api/update/${restaurantId}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': csrftoken,
        },
    })
        .then(response => {
            if (response.ok) {
                console.log(`Restaurant with ID ${restaurantId} deleted successfully.`);
                fetchUserRestaurants()
            } else {
                console.error(`Error deleting menu with ID ${restaurantId}.`);
            }
        })
        .catch(error => {
            console.error('Error deleting menu:', error);
        });

}
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}