import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NewsService } from '../services/news-service';
import { LoginService } from '../services/login.service';
import { Article } from '../interfaces/article';
import { FormsModule } from '@angular/forms';
import { NgIf, Location, CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { ToastrService } from 'ngx-toastr';
import { SessionService } from '../services/session.service';

@Component({
    selector: 'app-article-details',
    standalone: true,
    imports: [FormsModule, NgIf, CommonModule, HeaderComponent],
    templateUrl: './article-details.component.html',
    styleUrls: ['./article-details.component.css'],
})
export class ArticleDetailsComponent implements OnInit {
    article: Article | undefined;
    errorMessage: string | null = null;
    username: string | null | undefined;
    isSessionActive: boolean = false;

    constructor(
        private sessionService: SessionService,
        private toastr: ToastrService,
        private route: ActivatedRoute,
        private newsService: NewsService,
        private router: Router,
        private location: Location,
        private loginService: LoginService) {}
   
    async ngOnInit(): Promise<void> {
        let token: any;
        this.isLoggedIn();
        
        if(window.electronAPI && !this.isSessionActive){
            try {   
                token = await window.electronStore.get('userToken');
                if(token != null && token != "" ){
                    this.username=token;             
                    this.isSessionActive = true; 
                }
            } catch (error) {
                console.error('Error getting token:', error);
            }
        }
        
        const articleId = this.route.snapshot.paramMap.get('id');
        if (articleId) {
            this.newsService.getArticle(articleId).subscribe({
              next: (article) => {
                  this.article = article;
              },
              error: (err) => {
                  this.errorMessage = 'Could not load the article details.';
                  this.toastr.error('Could not load the article details! Click here to retry.', 'Article Notification', {
                    timeOut: 5000,
                    closeButton: true,
                    tapToDismiss: false,
                }).onTap.subscribe(() => {
                    // Retry fetching the article when the notification is clicked
                    this.retryLoadArticle(articleId);
                });
                console.error('Error fetching article: ', err);
              }
            });
        } else {
            this.errorMessage = 'No article ID provided.';
        }
    }

    // Retry logic when notification is clicked
    retryLoadArticle(articleId: string): void {
        this.newsService.getArticle(articleId).subscribe({
            next: (article) => {
                this.article = article;
                this.toastr.success('Article loaded successfully.', 'Article Notification');
            },
            error: (err) => {
                this.errorMessage = 'Failed to load article after retrying.';
                this.toastr.error('Failed to load article again. Please try later.', 'Article Notification');
                console.error('Error retrying article fetch: ', err);
            }
        });
    }

    isLoggedIn(): boolean {
        if(this.loginService.isLogged()){
            this.username = this.loginService.getUser()?.username;
            return true;
        }
        return false;
    }

    goBackToArticles() {
        this.router.navigate(['/home']);
    }

    editArticle(): void {
        if (this.article) {
            console.log('Navigating to edit article with ID:', this.article.id);
            this.router.navigate(['/article-edition', this.article.id]);
        }
    }

    confirmAndRemoveArticle(articleId: string): void {
        if (window.confirm('Are you sure you want to remove this article?')) {
            this.newsService.deleteArticle(articleId).subscribe({
                next: () => {
                  alert('Article removed successfully.');
                  this.toastr.success('Article removed successfully!','Article Notification');
                  this.goBackToArticles();
                },
                error: (err) => {
                  alert('Failed to remove article. Please try again.');
                  this.toastr.error('Failed to remove article. Please try again!','Article Notification');
                  console.error('Error removing article:', err);
                }
            });
        }
    }

    logout() {
        this.loginService.logout();
        this.router.navigate(['/login']);
    }

    login() {
        this.router.navigate(['/login']);
    }
}
