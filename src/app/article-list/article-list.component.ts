import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf,CommonModule } from '@angular/common';
import { Article } from '../interfaces/article';
import { NewsService } from '../services/news-service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleCategoryFilterPipe } from '../pipes/article-category-filter.pipe';
import { ArticleTextFilterPipe } from '../pipes/article-text-filter.pipe';
import { LoginService } from '../services/login.service';
import { HeaderComponent } from "../header/header.component";
import { SessionService } from '../services/session.service';
import { saveAs } from 'file-saver';
import { ToastrService } from 'ngx-toastr';

declare var bootstrap: any;
@Component({
    selector: 'app-article-list',
    standalone: true,
    imports: [HeaderComponent, NgFor, NgIf, FormsModule, ArticleCategoryFilterPipe, ArticleTextFilterPipe, CommonModule ],
    templateUrl: './article-list.component.html',
    styleUrls: ['./article-list.component.css']
})

export class ArticleListComponent implements OnInit{

    articles: Article[] = [];
    article: Article | undefined;
    isLoading = true;
    error: string | null = null;
    category: string = 'All';
    searchText: string = '';
    username: string | null | undefined;
    selectedPill: string = 'All';
    isElectronApp: boolean = false;
    isArticlesImported: boolean = false;
    isSessionActive: boolean = false;

    constructor(private toastr: ToastrService, private sessionService: SessionService, private newsService: NewsService, private router: Router, public loginService: LoginService) {}

    async ngOnInit() {

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

        if(!this.isArticlesImported){
            this.newsService.getArticles().subscribe({
                next: (data) => {
                    this.articles = data;
                    this.isLoading = false;
                    console.log('Fetched articles:', this.articles);
                },
                error: (err) => {
                    this.error = 'Failed to load articles. Please try again later.';
                    this.isLoading = false;
                    console.error('Error fetching articles:', err);
                },
            });
        }
    }

    isLoggedIn(): boolean {
        if(this.loginService.isLogged()){
            this.username = this.loginService.getUser()?.username;
            return true;
        }
        return false;
    }

    navigateToArticle(articleId: string) {
        this.router.navigate(['/article-details', articleId]);
    }

    setCategory(category: string): void {
        this.category = category;
        console.log('Selected category:', this.category);
    }

    onSearchChange(value: string) {
        console.log('Search Text Updated:', value);
        this.searchText = value;
    }

    logout() {
        this.isSessionActive = false;
        this.username = "";
        this.loginService.logout();
        this.sessionService.logout();
        this.router.navigate(['/login']);
    }

    login() {
        this.router.navigate(['/login']);
    }

    navigateToCreateArticle() {
        this.router.navigate(['/article-create']);
    }

    confirmAndRemoveArticle(articleId: string): void {
        if (window.confirm('Are you sure you want to remove this article?')) {
            this.newsService.deleteArticle(articleId).subscribe({
                next: () => {
                    alert('Article removed successfully.');
                    this.articles = this.articles.filter(article => article.id !== articleId);
                },
                error: (err) => {
                    alert('Failed to remove article. Please try again.');
                    console.error('Error removing article:', err);
                }
            });
        }
    }

    selectPill(pill: string): void {
        this.selectedPill = pill; 
        this.setCategory(pill);
    }  

    // Export articles
    exportArticles(): void {
        try {
            this.newsService.exportArticles(this.articles);
            this.toastr.success('Articles exported successfully!', 'Export');
        } catch (error){
            this.toastr.error('Export Error');
        }
        
    }

    // Import articles
    async importArticles(): Promise<void> {
        const articles: Article[] = [];
        try {
            let data: any;
            data = await this.newsService.importArticles();
            data = JSON.parse(data);
            if (Array.isArray(data.article)) {
            data.article.forEach((item: any) => {
                const article = this.newsService.validateAndCreateArticle(item);
                if (article) {
                    articles.push(article);
                    console.log('articles array: ' + JSON.stringify(articles));
                } else {
                    console.warn('Invalid article format:', item);
                }
            });

            // Update the component's articles array and set the flag
            this.articles = articles;
            this.isArticlesImported = true;

            // Update the articles in the NewsService
            this.newsService.setArticles(articles);

            this.toastr.success(`${articles.length} articles imported successfully!`, 'Import');
            this.isArticlesImported = true;
        } else {
            console.error('The JSON string does not represent an array.');
            this.toastr.error('Invalid JSON format', 'Import Error');
        }
           
            //console.log('importArticles - articles: ' + JSON.stringify(articles));
        } catch (error){
            this.toastr.error('Import Error: ' + error);
        }
        
    }

}