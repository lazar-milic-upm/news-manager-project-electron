import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { User } from '../interfaces/user';
import { LoginService } from '../services/login.service';
import { SessionService } from '../services/session.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})

export class LoginComponent{
    username: string = '';
    password: string = '';
    errorMessage: string | null = null;
    currentUser: User | null = null;
    isSessionActive: boolean = false;

    constructor(private toastr: ToastrService,private sessionService: SessionService,private router: Router, public loginService: LoginService) {}
    
    async ngOnInit() {
        let token: any;

        if(window.electronAPI && !this.isSessionActive){
            try {   
                token = await window.electronStore.get('userToken');
                if(token != null && token != "" ){
                    this.username=token;
                    this.isSessionActive = true;
                    this.router.navigate(['/home']);
                    this.toastr.success('Welcome back ' + this.username + '!', 'Logged In');                
                }
            } catch (error) {
                console.error('Error getting token:', error);
            }
        }
    }

    login() {
        this.loginService.login(this.username, this.password).subscribe({
            next: () => {
                this.router.navigate(['/home']);
                this.sessionService.saveToken(this.username);
            },
            error: () => {
                this.errorMessage = 'Login failed. Please try again.';
            }
        });
    }

    skipLogin() {
        this.router.navigate(['/home']);
    }
}