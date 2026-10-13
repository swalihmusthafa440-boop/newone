import { Link } from "react-router-dom"
function Header(params) {
    return(
        <header>
        <div className='navbar'>
      <nav  className="navbar navbar-expand-xl navbar-dark  bg-dark px-3"  >
      <a href='/' className="navbar-brand fw-bold text-warning me-2 " >MyBrand</a>
      <form className="d-flex search-box flex-grow-1 w-50 mx-1"  >
        <input className="form-control me-2  " placeholder= "Search" />
        <button className="btn btn-outline-success me-0">Search</button>
      </form>
    <div className='Loginsection'>
      <form className="bi bi-person-circle">
        <a href='login' className='btn btn-outline-success me-2'>Login</a>
        <a href='register' className='btn btn-outline-success me-2'>Register</a>
      </form>
    </div>
    <div className='cartsection'>
    <form className="bi bi-cart">
    <Link to="/cart" className='btn btn-outline-success me-1'>Cart</Link>
    </form>
    </div>
    </nav>
    </div>
    </header>
    )
}export default Header