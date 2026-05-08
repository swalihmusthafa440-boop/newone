import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
function ProductDetails({cartitems,setcartitems}) {



    const {id} = useParams()
    const [product,setproduct] = useState(null)
    useEffect(()=> {
        fetch(`http://127.0.0.1:8000/product/${id}`)
            .then((res)=> res.json())
            .then((data)=> {
                setproduct(data)
            })
    },[id])
    if (!product){
        return <h1>Loding...</h1>
    }
    const addtocart = (product)=> {
        setcartitems([...cartitems,product])
    }
    return(
        <div>
           <img src={product.image} alt="helloworld"/>
           <h1>{product.name}</h1>
           <h2>{product.price}</h2>
           <p>{product.description}</p>
           <button onClick={()=> addtocart (product)}>Add To Cart</button>
        </div>
    )
}export default ProductDetails