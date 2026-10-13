
import { Link } from "react-router-dom"
function ProductCard(item) {


    
    return(
        <div>
            <Link to={`/product/${item.id}`}>
                <img src={item.image} alt="product"/>
                <h4>{item.name}</h4>
                <p>{item.price}</p>
            </Link>
            
        </div>
    )
}export default ProductCard