import { Injectable } from '@angular/core';
import { Article } from '../interfaces/article';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private articles: Article[] = [];

  private newsUrl = 'http://sanger.dia.fi.upm.es/pui-rest-news/articles';  // URL to web api
  private articleUrl = 'http://sanger.dia.fi.upm.es/pui-rest-news/article';  // URL to web api

  constructor(private http: HttpClient, private sessionService: SessionService) {
    this.APIKEY = ""; 
  }

  // Set the corresponding APIKEY accordig to the received by email
  private APIKEY: string | null;
  private APIKEY_ANON = 'ANON09';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'PUIRESTAUTH apikey=' + this.APIKEY_ANON
    })
  };

  // Modifies the APIKEY with the received value
  setUserApiKey(apikey: string | undefined) {
    if (apikey) {
      this.APIKEY = apikey;
    }
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'PUIRESTAUTH apikey=' + this.APIKEY
      })
    };
    console.log('Apikey successfully changed ' + this.APIKEY);
  }

  setAnonymousApiKey() {
    this.setUserApiKey(this.APIKEY_ANON);
  }

  // Returns the list of news contain elements with the following fields:
  // {"id":...,
  //  "id_user":...,
  //  "abstract":...,
  //  "subtitle":...,
  //  "update_date":...,
  //  "category":...,
  //  "title":...,
  //  "thumbnail_image":...,
  //  "thumbnail_media_type":...}
  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(this.newsUrl, this.httpOptions);
  }

  // Downloads the article image to the user's computer
  deleteArticle(articleId: string): Observable<void> {
    const url = `${this.articleUrl}/${articleId}`;
    return this.http.delete<void>(url, this.httpOptions);
  }
  
  // Returns an article which contains the following elements:
  // {"id":...,
  //  "id_user":...,
  //  "abstract":...,
  //  "subtitle":...,
  //  "update_date":...,
  //  "category":...,
  //  "title":...,
  //  "image_data":...,
  //  "image_media_type":...}
  getArticle(id: string|null): Observable<Article> {
    console.log('Requesting article id=' + id);
    const url = `${this.articleUrl}/${id}`;
    return this.http.get<Article>(url, this.httpOptions);

  }

  // Update an existing article
  updateArticle(article: Article): Observable<Article> {
    console.log('Updating article id=' + article.id);
    return this.http.post<Article>(this.articleUrl, article, this.httpOptions);
  }

  // Create a new article
  createArticle(article: Article): Observable<Article> {
    console.log('Creating article');
    console.log(article);
    return this.http.post<Article>(this.articleUrl, article, this.httpOptions);
  }

  // Export articles to a JSON file
  exportArticles(articles: Article[]): void {
    const articlesJson = JSON.stringify(articles, null, 2); // Pretty JSON format
    const blob = new Blob([articlesJson], { type: 'application/json' });
    saveAs(blob, 'articles.json');
  }

  // Save imported articles
  setArticles(articles: Article[]): void {
    this.articles = articles;
    console.log('Articles imported:', this.articles);
  }

  // Import articles
  async importArticles(): Promise<string | undefined> {
    if (window.electronAPI && window.electronAPI.ipcRenderer) {
      const result = await window.electronAPI.ipcRenderer.invoke('import-article');
      return Promise.resolve(JSON.stringify(result));
    }
    return undefined;
  }

  async exportArticle(article: any): Promise<{ success: boolean; error?: string }> {
    if (window.electronAPI && window.electronAPI.ipcRenderer) {
      try {
        const result = await window.electronAPI.ipcRenderer.invoke('export-article', article);
        return result;
      } catch (error) {
        return { success: false, error: 'Failed to export article in Electron.' };
      }
    } else {
      // Web environment
      const jsonData = JSON.stringify(article, null, 2);
      return new Promise((resolve) => {
        try {
          const blob = new Blob([jsonData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${article.Title || 'exported_article'}.json`;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(url);
          
          resolve({ success: true });
        } catch (error) {
          resolve({ success: false, error: 'Failed to export article in the web.' });
        }
      });
    }
  }

  // Validate and create a single article
  validateAndCreateArticle(data: any): Article | null {
    console.log('Validating and creating article:', JSON.stringify(data));
    if (data.id) {
      return {
        id: data.id || '',
        title: data.title,
        abstract: data.abstract || '',
        subtitle: data.subtitle || '',
        body: data.body,
        update_date: data.update_date ? new Date(data.update_date) : new Date(),
        modifiedDate: data.modifiedDate ? new Date(data.modifiedDate) : new Date(),
        category: data.category || '',
        image_data: data.image_data || '',
        username: data.username || '',
        thumbnail_image: data.thumbnail_image || '',
        image_media_type: data.image_media_type || '',
      };
    }
    return null;
  }
}
