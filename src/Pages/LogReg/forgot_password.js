import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import './forgot.css'
function Forgot_Password() {
    const [email,setemail] =useState("")
    const navigate = useNavigate()

    const submit = async (e)=> {
        e.preventDefault()
        const res = await axios.post("http://127.0.0.1:8000/forgot_password",{email:email})
        if (res.data.status === "success"){
            navigate (`/resetpassword?email=${email}`)
        }else{
            alert("User Not Found")
        }
    }
    return(
        <form className="forgot_pass" onSubmit={submit}>
            <h2>Forgot Password</h2>
            <input type="email" placeholder="Enter Email" onChange={(e)=> setemail(e.target.value)}/>
            <button>Send Link</button>
        </form>
    )
}
export default Forgot_Password