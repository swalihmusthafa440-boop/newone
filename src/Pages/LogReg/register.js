import './register.css'
import {useState} from 'react'
import {useNavigate} from "react-router-dom"
function Register() {
  const [username,setusername] = useState("")
  const [password,setpassword] = useState("")
  const [email,setemail] = useState('')

  const navigate = useNavigate();


   
  const register = async () => {

    try {
      const respon = await fetch('http://127.0.0.1:8000/register',{
        method:'POST',
        headers:{
          "Content-Type":"application/json",
        },
        body:JSON.stringify({username:username,password:password,email:email})
      })
      if (respon.status === 201 ){
        navigate("/login")
      }
      const data=respon.json()
      console.log(data)
    } catch (error) {
      console.log(error)
    }
  }

  
  
  return (
    <div className="App">
      <h2 className='bold'>Sign Up</h2>
      <p className='userregister'><input type='text' placeholder='Username' onChange={(e)=>setusername (e.target.value)}/></p>
      <p className='passwordregister'><input type='password' placeholder='Password' onChange={(e)=> setpassword(e.target.value)}/></p>
      <p className='emailregister'><input type='email' placeholder='Email' onChange={(e)=> setemail (e.target.value)}/></p>
      <p className='buttonregister'><button onClick={register}>submit</button></p>
      <p className='loginformat'>If you have an account? <a href='login'>Login</a></p>
    </div>
    
  );
}

export default Register;