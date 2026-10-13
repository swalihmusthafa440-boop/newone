import './App.css'
import {  Route, Routes } from "react-router-dom";
import Register from './Pages/LogReg/register'
import Login from './Pages/LogReg/login'


import Navbar from "./Pages/Navbar";
import Newpassword from './Pages/LogReg/forgot_password'
import Newnavbar from './Pages/newNavbar';
import Carts from './Pages/cart';
import ResetPassword from './Pages/LogReg/reset_password';
import ProtectedRoute from './Pages/protected/ProtectedRoute';
import ProductDetails from './Pages/Productdetails';
import OrderPage from './Pages/orderpage';
import { useState } from 'react';
function App() {
  const [cartitems,setcartitems]=useState([])
  return (
      <Routes>
        <Route path="register" element={<Register />}/>,
        <Route path='/login' element={<Login/>}/>
        <Route path="/" element={<Navbar />}/>
        <Route path='forgot_password' element={<Newpassword/>}/>
        <Route path='newnavbar' element={<ProtectedRoute><Newnavbar/></ProtectedRoute>}/>
        <Route path='cart' element={<ProtectedRoute><Carts cartitems={cartitems} setcartitem={setcartitems}/></ProtectedRoute>}/>
        <Route path='resetpassword' element={<ResetPassword/>}/>
        <Route path="/product/:name/:id" element={<ProductDetails/>}/>
        <Route path='/orderpage' element={<OrderPage/>}/>
        <Route path='/product/:id'element={<ProductDetails cartitems={cartitems} setcartitems={setcartitems}/>}/>
      </Routes>
  )}export default App