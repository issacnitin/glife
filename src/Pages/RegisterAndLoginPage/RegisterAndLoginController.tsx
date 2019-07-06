import { AuthProvider, RegisterUserModal, LoginUserModal } from '../../Engine/Providers/AuthProvider'
import { ProfileUtils } from '../../Engine/Utils/ProfileUtils';
import * as Engine from '../../Engine/Engine';

export class RegisterAndLoginController {

    error: string

    constructor() {
        this.error = ""
    }

    GetCachedEmail = () => {
        return Engine.Instance.BlobProvider.email
    }

    GetCachedPassword = () => {
        return Engine.Instance.BlobProvider.password
    }

    GetRandomUsername = async(): Promise<string> => {
        var username = await ProfileUtils.GetRandomUsername()
        return username
    }

    ValidateUsername = async(username: string): Promise<boolean> => {
        return ProfileUtils.ValidateUsername(username)
    }

    Login = async(email: string, password: string): Promise<boolean> => {
        try {
            var res = await AuthProvider.LoginUser({
                Email: email,
                Password: password
            } as LoginUserModal)
            if(res) {
                Engine.Instance.setEmailPassword(email, password)
                return true
            } 
            return false
        } catch(err) {
            this.error = err.toString()
            return false
        }
    }

    Register = async(email: string, phone: string, password: string): Promise<boolean> => {
        try {
            var res = await AuthProvider.RegisterUser({
                Email: email,
                Phone: phone,
                Password: password
            } as RegisterUserModal)
            if(res) {
                Engine.Instance.setEmailPassword(email, password)
                return true
            } 
            return false
        } catch(err) {
            this.error = err.toString()
            return false
        }
    }

    LoginUsingGoogle = async(email: string, idToken: string) : Promise<boolean> => {
        try {
            var res = await AuthProvider.LoginUserWithGoogle(email, idToken)
            if(res) return true
            return false
        } catch(err) {
            this.error = err.toString();
            return false
        }
    }

    RegisterUsingGoogle = async () : Promise<boolean> => {
        try {
            var res = await AuthProvider.RegisterUserWithGoogle()
            if(res) return true
            return false
        } catch(err) {
            this.error = err;
            return false
        }
    }
}