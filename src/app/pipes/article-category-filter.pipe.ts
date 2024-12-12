import { Pipe, PipeTransform } from '@angular/core';
import { Article } from '../interfaces/article';

@Pipe({
  name: 'articleCategoryFilter',
  standalone: true
})
export class ArticleCategoryFilterPipe implements PipeTransform {
  transform(articles: Article[], category: string): Article[] {
    if (!articles || category === 'All') {
      return articles;
    }
    return articles.filter(article => article.category === category);
  }
}