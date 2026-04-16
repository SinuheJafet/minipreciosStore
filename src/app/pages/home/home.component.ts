import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product, Category } from '../../models/product.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  saleProducts: Product[] = [];
  categories: Category[] = [];

  banners = [
    { title: 'Cuídate sin gastar de más', subtitle: 'Hasta 40% de descuento en higiene y cuidado personal. Las mejores marcas al mejor precio', cta: 'Explorar ofertas', link: '/products', filter: 'sale', bg: 'gradient-1', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80' },
    { title: 'Skincare que realmente funciona', subtitle: 'CeraVe, La Roche-Posay, Nivea y más. Tu piel merece lo mejor', cta: 'Ver skincare', link: '/products', filter: '', bg: 'gradient-2', img: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80' },
    { title: 'Tu rutina de belleza completa', subtitle: 'Maquillaje, fragancias y cuidado corporal. Todo en un solo lugar', cta: 'Ver maquillaje', link: '/products', filter: '', bg: 'gradient-3', img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80' },
  ];

  activeBanner = 0;

  highlights = [
    { icon: '🚚', title: 'Envío gratis', desc: 'En pedidos +50€' },
    { icon: '🔄', title: 'Devolución fácil', desc: '30 días sin preguntas' },
    { icon: '🛡️', title: 'Garantía total', desc: '2 años en todos los productos' },
    { icon: '💬', title: 'Soporte 24/7', desc: 'Asistencia siempre disponible' },
  ];

  constructor(private productService: ProductService, private router: Router) {}

  ngOnInit(): void {
    this.productService.getFeaturedProducts().subscribe(p => this.featuredProducts = p.slice(0, 4));
    this.productService.getSaleProducts().subscribe(p => this.saleProducts = p.slice(0, 4));
    this.productService.getCategories().subscribe(c => this.categories = c);
    setInterval(() => this.activeBanner = (this.activeBanner + 1) % this.banners.length, 5000);
  }

  goToCategory(slug: string): void {
    this.router.navigate(['/products'], { queryParams: { category: slug } });
  }
}
