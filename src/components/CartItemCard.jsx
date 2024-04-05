import react, {useState, useEffect} from 'react';
import { FiPlusCircle, FiMinusCircle} from "react-icons/fi";
import { BsTrash } from "react-icons/bs";
import "../styles/shopping_cart_item.css";

export function CartItemCard ({product}){

    const [purchased, setPurchased] = useState(product.purchased);
    const [subtotal, setSubtotal] = useState((product.purchased * product.item.price).toFixed(2));

    const user_id = "001";

    const QuantityPlusOne = async () =>{
        if(purchased >= 1){
            try{
                const params = {
                    "user_id": user_id,
                    "item_id": product.item.item_id
                };        

                const response = await fetch('http://localhost:3001/quantity-plus-one',{
                    method: 'POST',
                    headers : {
                        'Content-Type':'application/json'
                    },
                    body : JSON.stringify(params)
                });

             
                
                const result = await response.json();
                console.log(result);
                
                if(response.ok){
                    setPurchased(result.purchased);
                    setSubtotal(result.subtotal);
                } else {
                    if(response.status === 400){
                        alert(`${result.message}`);
                    }
                }
            }catch(err) {console.log(err)}
        }
    }

    const QuantityMinusOne = async () =>{
        if(purchased >= 1){
            try{
                const params = {
                    "user_id": user_id,
                    "item_id": product.item.item_id
                };        

                const response = await fetch('http://localhost:3001/quantity-minus-one',{
                    method: 'POST',
                    headers : {
                        'Content-Type':'application/json'
                    },
                    body : JSON.stringify(params)
                });

                if (!response.ok) {
                    throw new Error('Error updating quantity of shopping cart item');
                  }
                
                const result = await response.json();

                setPurchased(result.purchased);
                setSubtotal(result.subtotal);
            }catch(err) {console.log(err)}
        }
    }
  
    const DeleteFromCart =  async() =>{
        if(confirm(`Are you sure you want to delete ${product.item.name} from cart? \n(This action is irreversible)`)){
            if(purchased > 0){
                try{
                    const data = {
                        "user_id": user_id,
                        "item_id": product.item.item_id
                    };        

                    const response = await fetch('http://localhost:3001/delete-item',{
                        method: 'DELETE',
                        headers : {
                            'Content-Type':'application/json'
                        },
                        body : JSON.stringify(data)
                    });


                    if (!response.ok) {
                        throw new Error('Error deleting shopping cart item');
                    }
                    
                    
                    
                }catch(err) {console.log(err)}
        }
    }
}
 
    return (
        <div className="row card-item hover-shadow rounded-2 my-1">
            <div className="col col-md-2">
                <img src='' alt={product.item.name}/>
            </div>
            <div className="col col-md-10">
                <div className='row'>
                    <div className="col col-md-9 text-start">
                        <p className="product-name mb-0">{product.item.name} </p>
                        <p className="vendor-name">{product.item.vendor}</p>
                    </div>
                    <div className="col col-md-3 text-end ">
                        <p className="price mb-0">Price &#58; &#36; {product.item.price}</p>
                        <div className="d-flex justify-content-end ">
                                <div className="plus-one"><FiPlusCircle onClick={QuantityPlusOne}/></div>
                                <div className="mx-1"><p>Quantity {purchased} </p></div>
                                <div className="minus-one"><FiMinusCircle onClick={QuantityMinusOne}/></div>
                                <div className="mx-2 trash-can"><BsTrash onClick={DeleteFromCart}/></div>
                        </div>
                        <p>Subtotal &#58; &#36; {subtotal}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}