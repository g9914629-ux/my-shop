import { RouterProvider } from "react-router-dom"
import { myrouter } from "./router"


// import Header from "./components/header"
// import Home from "./pages/Home"
// import Product from "./pages/product"
// import Carts from "./pages/carts"


function App() {
  return (
    <RouterProvider router={myrouter}/>
  )
}

export default App