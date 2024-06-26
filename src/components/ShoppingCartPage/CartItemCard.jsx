import react, {useState, useEffect} from 'react';
import { FiPlusCircle, FiMinusCircle} from "react-icons/fi";
import { BsTrash } from "react-icons/bs";
import '../../styles/shopping_cart_item.css';
import { jwtDecode } from 'jwt-decode';

export function CartItemCard ({product, onUpdateTotal}){

    
    const [purchased, setPurchased] = useState(product.purchased); //purchased amount
    const [subtotal, setSubtotal] = useState((product.purchased * product.item.price).toFixed(2)); // subtotal
    const [invisible, setInvisible] = useState(false); //visibility

    const fetchUserId = ()=>{
        const token = localStorage.getItem('token');
        if(!token) {
            return null;
        }
        const decoded_token = jwtDecode(token);
        return decoded_token.id
     }
    const user_id = fetchUserId();

    //add quantity by 1
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
                    //update corresponding details
                    setPurchased(result.purchased);
                    setSubtotal(result.subtotal);
                    onUpdateTotal(result.total);
                } else {
                    if(response.status === 400){
                        alert(`${result.message}`);
                    }
                }
            }catch(err) {console.log(err)}
        }
    }
    
    //decrease quantity by 1
    const QuantityMinusOne = async () =>{
        if(purchased > 1){
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
                onUpdateTotal(result.total);
            }catch(err) {console.log(err)}
        }else{ 
            //when quantity = 1, cannot drop further below
            alert('Item quantity must be at least 1\n Click trash can to delete items instead');
        }
    }
  
    //delete from cart
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
                    
                    const result = await response.json();
                    onUpdateTotal(result.total); // update total price
                    setInvisible(true); //hide card from user 
                    
                }catch(err) {console.log(err)}
        }
    }
}
 
    return (
        <div className={`row card-item rounded-3  my-2 ${invisible ? 'd-none' : ''}`}>
            <div className="col col-md-2 d-flex justify-content-center align-items-center overflow-hidden">
                <img src={product.item.url} alt={product.item.name} style={{maxWidth: '75%', maxHeight: '75%', objectFit: 'contain'}}/>
            </div>
            <div className="col col-md-10  card-item-details">
                <div className='row '>
                    <div className="col col-md-9 text-start">
                        <p className="item-name mb-0">{product.item.name} </p>
                        <p className="vendor-name">{product.item.vendor}</p>
                    </div>
                    <div className="col col-md-3 text-end ">
                        <p className="price mb-0">Price &#58; &#36; {product.item.price}</p>
                        <div className="d-flex justify-content-end ">
                                <div className="plus-one"><FiPlusCircle onClick={QuantityPlusOne}/></div>
                                <div className="mx-1"><p>Quantity&#58; {purchased} </p></div>
                                <div className="minus-one"><FiMinusCircle onClick={QuantityMinusOne}/></div>
                                <div className="mx-2 trash-can"><BsTrash onClick={DeleteFromCart}/></div>
                        </div>
                        <p  >Subtotal &#58; &#36; {subtotal}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}