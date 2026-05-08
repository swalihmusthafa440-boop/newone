
import './cart.css'
import { useNavigate } from "react-router-dom"
function Carts({cartitems,setcartitems}) {


  const navigate=useNavigate()
  const totalPrice = cartitems.reduce((total,item)=> {
    return total + (item.price * item.quantity)
  },0)

  const totalQuantity = cartitems.reduce ((total,item)=> {
    return total + item.quantity
  },0)
  
  const deleteitem = (id) => {
    const updatedCart = cartitems.filter((item)=> item.id !== id)
    setcartitems(updatedCart)
  }
  
  const updateQuantity = (id,newQuantity)=> {
    setcartitems(cartitems.map((item)=>
      item.id === id
      ? {...item,quantity:newQuantity}
      :item

    (
      <div key={item.id}>
        <h2>{item.name}</h2>
        <p>{item.price}</p>
      </div>
    )))    
  }
  const handleorder = async () => {
    navigate('/orderpage')
  }
    return(
      <div className='navbar'>
        <nav  className="navbar navbar-expand-xl navbar-dark  bg-dark px-3"  >
          <a href='newnavbar' className="navbar-brand fw-bold text-warning me-2 " >MyBrand</a>
          <form className="d-flex search-box flex-grow-1 w-50 mx-1"  >
            <input className="form-control me-2  " placeholder= "Search" />
            <button className="btn btn-outline-success me-0">Search</button>
          </form>
        </nav>
        <div className="cart-container">
          <div className="cart-left">
            {cartitems.map((product)=>(
            <div className="empty" key={product.id} >
              <img src={product.image} alt="cart-img" className="cart-img" onClick={()=> navigate(`/product/${product.product_name}/${product.id}`)} style={{cursor:"pointer"}}/>
                <div className="product-info" onClick={()=> navigate(`/product/${product.product_name}/${product.id}`)} style={{cursor:"pointer"}}>
                  <h3 style={{fontSize:'17px'}}>{product.product_name}</h3>
                  <p style={{fontSize:'12px'}}>{product.description}</p>
                  <p style={{color:'green'}}>{product.price * product.quantity}</p>
                </div> 
              
                <div className="cart-details">
                  <div className="quantity">
                    <p><button onClick={()=> updateQuantity(product.id,Math.max(1,product.quantity-1))}>-</button></p>
                    <span>Quan: {product.quantity}</span>
                    <p><button onClick={()=> updateQuantity(product.id,product.quantity +1)}>+</button></p>
                  </div>
                  <div className="bybn">
                    <button className="Buy-btn" onClick={()=> navigate('/orderpage')} >Buy This </button>
                    <button className="remove-btn" onClick={()=>deleteitem(product.id)}>Remove</button>
                  </div>
                </div>
              </div>
    ))}
    </div>
      <div className="cart-right" > 
        <h3>Price Details</h3>
        <p className="helloworld"><span>MRP :</span> <span> {totalPrice}</span></p>
        <p className="world"><span>Quantity : </span> <span> {totalQuantity}</span></p>
        <p className="hello"><span>Total Price : </span> <span>{totalPrice}</span></p>
        <button onClick={handleorder}>Place Order</button>
      </div>
    </div>
    
    </div>
    )
}export default Carts