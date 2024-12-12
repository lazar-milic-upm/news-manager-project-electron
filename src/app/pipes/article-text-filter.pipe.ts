import { Pipe, PipeTransform } from '@angular/core';
import { Article } from '../interfaces/article';

@Pipe({
  name: 'articleTextFilter',
  standalone: true,
})
export class ArticleTextFilterPipe implements PipeTransform {
  transform(articles: Article[], searchText: string, excludes: string[] = []): Article[] {
    if (!articles || !searchText) {
      return articles;
    }

    const lowerCaseSearchText = searchText.toLowerCase();

    return articles.filter(article => this.checkInside(article, lowerCaseSearchText, excludes));
  }

  private checkInside(item: Article, term: string, excludes: string[]): boolean {
    if (excludes.includes('title') && excludes.includes('subtitle')) {
      return false;
    }

    if (!excludes.includes('title') && item.title.toLowerCase().includes(term)) {
      return true;
    }

    if (!excludes.includes('subtitle') && item.subtitle.toLowerCase().includes(term)) {
      return true;
    }

    return false;
  }
}