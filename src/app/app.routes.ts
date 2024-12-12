import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ArticleListComponent } from './article-list/article-list.component';
import { LoginComponent } from './login/login.component';
import { ArticleDetailsComponent } from './article-details/article-details.component';
import { ArticleEditionComponent } from './article-edition/article-edition.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'home', component: ArticleListComponent },
    { path: 'articles', component: ArticleListComponent },
    { path: 'article-details/:id', component: ArticleDetailsComponent },
    { path: 'article-edition/:id', component: ArticleEditionComponent },
    { path: 'article-create', component: ArticleEditionComponent },
    { path: '**', redirectTo: 'login' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {}
