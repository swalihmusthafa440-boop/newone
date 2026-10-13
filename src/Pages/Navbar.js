import Header from './normal/Header';
import './Navbar.css'
import Slider from './normal/slider';
import Product from './product'
const Navbar = () => {
  return (
    
    <div>
      <Header/>  
        <Slider />
          <h1 style={{paddingLeft:'16px',color: 'rgb(84, 117, 106)'}}>Products</h1>
          <div>
            <Product/>
          </div>
      </div>
      
  );
  };

export default Navbar;