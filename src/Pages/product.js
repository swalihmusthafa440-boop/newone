import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import './product.css'



function ProductList(params) {
    const [product,setproduct] = useState([])
    const navigate = useNavigate()
    useEffect (()=> {
        fetch("http://127.0.0.1:8000/add_to_cart")
        .then((res)=> res.json())
        .then((data)=>{
          setproduct(data)
        })
        .catch(err => console.log(err))
  },[])
  
  return(
    <div className="home-info">
        {product.map((item)=>(
        <div >
            <img src={item.image} alt="cart-img" className="cart-img" onClick={()=> navigate(`/product/${item.id}`)} style={{cursor:"pointer"}}/>
                <div className="product-info" onClick={()=> navigate(`/product/${item.id}`)} style={{cursor:"pointer"}}>
                  <h3 style={{fontSize:'17px'}}>{item.product_name}</h3>
                  <p style={{color:'green'}}>{item.price }</p>
                </div>  
        </div>
    ))}
    </div>
  )}export default ProductList
