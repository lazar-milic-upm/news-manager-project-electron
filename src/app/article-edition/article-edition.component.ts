import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Article } from '../interfaces/article';
import { NewsService } from '../services/news-service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgFor, NgIf, Location, CommonModule } from '@angular/common';
import { QuillModule } from 'ngx-quill';
import { LoginService } from '../services/login.service';
import { HeaderComponent } from '../header/header.component';
import _, { random } from 'lodash';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-article-edition',
    templateUrl: './article-edition.component.html',
    styleUrls: ['./article-edition.component.css'],
    standalone: true,
    imports: [NgFor, NgIf, QuillModule, ReactiveFormsModule, CommonModule, HeaderComponent]
})
export class ArticleEditionComponent implements OnInit {
    article: Article = {
        id: '',
        title: '',
        abstract: '',
        subtitle: '',
        body: '',
        update_date: new Date(),
        modifiedDate: new Date(),
        category: '', 
        image_data: '',
        username: '',
        thumbnail_image: '',
        image_media_type: ''
    };
    categories: string[] = ['National', 'Economy', 'Sports', 'Technology'];
    isEditing: boolean = false;
    feedbackMessage: string | null = null;
    articleForm: FormGroup;
    articleId: string | null;
    username: string | null | undefined;
    imageError: string | null = null;
    isImageSaved: boolean = false;
    cardImageBase64: string | null = null;
    cardImageType: string | null | undefined;
    isCreateArticleDisabled: boolean = false;
    isElectronApp: boolean = false;

    constructor(private toastr: ToastrService, private newsService: NewsService, private loginService: LoginService,private router: Router, private route: ActivatedRoute, private location: Location, private fb: FormBuilder,) {
        this.articleForm = this.fb.group({
            title: ['', Validators.required],
            subtitle: ['', Validators.required],
            abstract: ['', Validators.required],
            category: ['', Validators.required],
            image_media_type: [],
            body: [],
            image_data: [],
            thumbnail_image: [],
            username: []
        });
        this.articleId='';
        this.cardImageType = '';
    }

    ngOnInit(): void {

      if(this.isLoggedIn())
        this.username = this.loginService.getUser()?.username;

      this.articleId = this.route.snapshot.paramMap.get('id');
      if (this.articleId) {
          this.isEditing = true;
          this.loadArticle(this.articleId);
      }
      else{
          this.isEditing = false;
      }

      if (this.isEditing && this.article) {
          this.articleForm.patchValue(this.article);
      }
    }

    loadArticle(articleId: string) {
      this.newsService.getArticle(articleId).subscribe({
          next: article => {
              this.article = article;
              this.article.id = articleId;
              this.articleForm.patchValue(article);
              if(this.username)
                  this.article.username = this.username;
              
              if(this.article.image_data){
                  this.isImageSaved = true;
                  this.cardImageBase64 = this.article.image_data;
                  this.cardImageType = this.article.image_media_type;
              }
              else
                  this.isImageSaved = false;
          },
          error: err => {
              this.feedbackMessage = 'Error loading article.';
              this.toastr.error('Could not load the article details!', 'Article Notification', {
                timeOut: 5000,
                closeButton: true,
                tapToDismiss: false,
                }).onTap.subscribe(() => {
                    this.loadArticle(articleId);
                });
                console.error('Error loading article:', err);
          }
      });
    }

    onSubmit() {

        if (this.articleForm.invalid) {
        this.handleFormErrors();
        return;
        }

      if(this.username)
          this.article.username = this.username;

      if (this.articleForm.valid && this.article ) {
          this.article.title=this.articleForm.value.title;
          this.article.subtitle=this.articleForm.value.subtitle;
          this.article.abstract=this.articleForm.value.abstract;
          this.article.category=this.articleForm.value.category;
          this.article.body=this.articleForm.value.body;

          if(this.isEditing && this.articleId){
            this.article.id=this.articleId;
            this.newsService.updateArticle(this.article).subscribe({
                next: (updatedArticle) => {
                    if (updatedArticle) {
                        this.feedbackMessage = 'Article updated successfully!';
                        this.toastr.success('Article updated successfully!','Article Notification');
                        this.router.navigate(['/article-details', updatedArticle.id]);
                    } else {
                        this.feedbackMessage = 'Failed to update article.';
                        this.toastr.error('Failed to update article!','Article Notification');
                    }
                },
                error: err => {
                    this.feedbackMessage = 'An error occurred while updating the article.';
                    this.toastr.error('An error occurred while updating the article!','Article Notification');
                    console.error('Update error:', err);
                }
            });
          }
          else{
              this.article.id = null;
              this.isCreateArticleDisabled = true;
              this.newsService.createArticle(this.article).subscribe({
                  next: (createdArticle) => {
                      if (createdArticle) {
                          console.log('createdArticle.id:'+createdArticle.id);
                          this.feedbackMessage = 'Article created successfully!';
                          this.toastr.success('Article created successfully!','Article Notification');
                          window.confirm('The article has been created and you will be redirected to the article detail page.');
                          this.router.navigate(['/article-details', createdArticle.id]);
                      } else {
                          this.feedbackMessage = 'Failed to create article.';
                          this.isCreateArticleDisabled = false;
                          this.toastr.error('Failed to create article!','Article Notification');
                      }
                  },
                  error: err => {
                      this.feedbackMessage = 'An error occurred while creating the article.';
                      this.toastr.error('An error occurred while creating the article!','Article Notification');
                      this.isCreateArticleDisabled = false;
                      console.error('Create error:', err);
                  }
            });
          }
      } else {
          this.feedbackMessage = 'Invalid article data.';
          this.toastr.error('Invalid article data!', 'Article Notification');
      }
    }

    handleFormErrors(): void {
        // Mark all form controls as touched to trigger validation messages
        for (const control of Object.values(this.articleForm.controls)) {
            control.markAsTouched();
        }

        // Show error notification with an action for the user to fix errors
        this.toastr.error('Please fix the highlighted errors before submitting.', 'Article Notification', {
            timeOut: 5000,
            closeButton: true,
            tapToDismiss: false,
        }).onTap.subscribe(() => {
            // Scroll to the first invalid field when the notification is clicked
            this.scrollToFirstInvalidField();
        });
    }

    scrollToFirstInvalidField(): void {
        const firstInvalidControl = Object.keys(this.articleForm.controls).find(
            key => this.articleForm.controls[key].invalid
        );

        if (firstInvalidControl) {
            const fieldElement = document.getElementsByName(firstInvalidControl)[0];
            if (fieldElement) {
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (fieldElement as HTMLElement).focus();
            }
        }
    }

    logout() {
        this.loginService.logout();
        this.router.navigate(['/login']);
    }

    login() {
        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
        return this.loginService.isLogged();
    }

    goBack() {
        this.location.back();
    }
    
    fileChangeEvent(fileInput: any) {
        this.imageError = null;
        if (fileInput.target.files && fileInput.target.files[0]) {
            const MAX_SIZE = 20971520;
            const ALLOWED_TYPES = ['image/png', 'image/jpeg'];
            if (fileInput.target.files[0].size > MAX_SIZE) {
              this.imageError = 'Maximum size allowed is ' + MAX_SIZE / 1000 + 'MB';
              return;
            }
            if (!ALLOWED_TYPES.includes(fileInput.target.files[0].type)) {
              this.imageError = 'Only Images are allowed ( JPG | PNG )';
              return;
            }
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const base64String = e.target.result;
                this.cardImageBase64 = base64String.split(',')[1]; 
                this.isImageSaved = true;
                this.article.image_media_type = fileInput.target.files[0].type;
                this.cardImageType = fileInput.target.files[0].type;
                this.article.image_data = base64String.split(',')[1];  
                this.article.thumbnail_image = base64String.split(',')[1];  
            };
            reader.readAsDataURL(fileInput.target.files[0]);
        }
    }

    get form() {
        return this.articleForm;
    }
    get title(){
        return this.articleForm.get('title');
    }
    get subtitle(){
        return this.articleForm.get('subtitle');
    }
    get abstract(){
        return this.articleForm.get('abstract');
    }
    get category(){
        return this.articleForm.get('category');
    }
    get body(){
        return this.articleForm.get('body');
    }
    get image_data(){
        return this.articleForm.get('image_data');
    }
}
