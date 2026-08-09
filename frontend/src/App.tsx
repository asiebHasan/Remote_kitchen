import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './lib/auth'
import { FullPageLoader } from './components/ui'
import { CartProvider } from './lib/cart'
import PublicLayout from './components/PublicLayout'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import RestaurantMenu from './pages/RestaurantMenu'
import Cart from './pages/Cart'
import MyOrders from './pages/MyOrders'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Restaurants from './pages/Restaurants'
import RestaurantEdit from './pages/RestaurantEdit'
import Menus from './pages/Menus'
import Employees from './pages/Employees'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import PaymentProcess from './pages/PaymentProcess'
import PaymentResult from './pages/PaymentResult'
import NotFound from './pages/NotFound'

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />

  return (
    <CartProvider>
      <Routes>
        {/* Public customer-facing site */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/restaurants/:id" element={<RestaurantMenu />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/my-orders"
            element={
              <Protected>
                <MyOrders />
              </Protected>
            }
          />
          <Route
            path="/payment/process"
            element={
              <Protected>
                <PaymentProcess />
              </Protected>
            }
          />
          <Route
            path="/payment/done"
            element={
              <PaymentResult
                title="Payment successful"
                message="Your payment has been processed successfully."
              />
            }
          />
          <Route
            path="/payment/canceled"
            element={
              <PaymentResult
                tone="canceled"
                title="Payment canceled"
                message="Your payment was not completed. You can try again anytime."
              />
            }
          />
        </Route>

        {/* Owner / admin panel */}
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/restaurants" element={<Restaurants />} />
          <Route path="/app/restaurants/:id" element={<RestaurantEdit />} />
          <Route path="/app/menus" element={<Menus />} />
          <Route path="/app/employees" element={<Employees />} />
          <Route path="/app/orders" element={<Orders />} />
          <Route path="/app/orders/:id" element={<OrderDetails />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </CartProvider>
  )
}
