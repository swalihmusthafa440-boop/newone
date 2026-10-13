import ProductCard from './ProductCard'
import './newNavbar.css'
import { Link } from 'react-router-dom'
import Slider from './normal/slider'
import { useNavigate } from 'react-router-dom'
import Product from './product'
function Newnavbar() {
  const navigate = useNavigate()
  const handleLogout= async () => {
    
        try {
            const refreshToken=localStorage.getItem("refresh")
            const words = await fetch('http://127.0.0.1:8000/logout',{
                method:'POST',
                headers:{
                    "Content-Type":"application/json",
                },
                body:JSON.stringify({refresh:refreshToken})
            })
            if (words.status === 205){
              navigate('/')
            }else
              console.log("logout Failed")
              const data= await words
              console.log(data)
              localStorage.removeItem("isLoggedIn")
        } catch (error) {
            console.log(error)
        }
    }
    return(
    <div>
      <div className='navbar'>
      <nav  className="navbar navbar-expand-xl navbar-dark  bg-dark px-3"  >
      <a href='/' className="navbar-brand fw-bold text-warning me-2 " >MyBrand</a>
      <form className="d-flex search-box flex-grow-1 w-50 mx-1"  >
        <input className="form-control me-2  " placeholder= "Search" />
        <button className="btn btn-outline-success me-0">Search</button>
      </form>
    <form className="bi bi-cart">
    <Link to="/cart" className='btn btn-outline-success me-1'>Cart</Link>
    </form>
      <div className='cartsection'>
        <button type='button' className='logoutbutton' onClick={handleLogout}>Logout</button> 
      </div>
    </nav>
      <Slider />
      <h3 style={{paddingLeft:'16px',color: 'rgb(84, 117, 106)' }}>Products</h3>
      <div>
        <ProductCard/>
      </div>
      <div>
        <Product/>
      </div>
    </div>
    </div>
    )
}export default Newnavbar