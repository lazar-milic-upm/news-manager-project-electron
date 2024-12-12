import { Component, OnInit } from '@angular/core';
import { LoginService } from '../services/login.service';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { SessionService } from '../services/session.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [ NgIf],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{

    isElectronApp: boolean = false;
    isLoggedIn: boolean = false;
    isSessionActive: boolean = false;
    username: string = "";

    constructor(private sessionService: SessionService, private loginService: LoginService,private router: Router) {}

    async ngOnInit() {
        let token: any;

        if(window.electronAPI && !this.isSessionActive){
            try {   
                token = await window.electronStore.get('userToken');
                if(token != null && token != "" ){
                    this.username=token;              
                    this.isSessionActive=true;
                }
            } catch (error) {
                console.error('Error getting token:', error);
            }
        }
    }

    checkLogin(): boolean {
        if(this.loginService.isLogged()){
            this.isLoggedIn = true;
            return true;
        }
        return false;
    }

    logout() {
        this.username = "";
        this.isSessionActive = false;
        this.loginService.logout();
        this.sessionService.logout();
        this.router.navigate(['/login']);
    }

    login() {
        this.router.navigate(['/login']);
    }
}
