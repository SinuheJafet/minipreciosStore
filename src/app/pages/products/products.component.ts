import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  selectedCategory = '';
  selectedSort = 'featured';
  searchQuery = '';
  activeFilter = '';
  priceRange = { min: 0, max: 150 };
  currentMax = 150;
  loading = true;

  categories = [
    { slug: '', label: 'Todos' },
    { slug: 'oral-care', label: 'Higiene Oral' },
    { slug: 'skincare', label: 'Cuidado de Piel' },
    { slug: 'body-care', label: 'Cuidado Corporal' },
    { slug: 'hair-care', label: 'Cuidado Capilar' },
    { slug: 'makeup', label: 'Maquillaje' },
    { slug: 'fragrances', label: 'Fragancias' },
    { slug: 'baby', label: 'Cuidado Bebé' },
  ];

  sortOptions = [
    { value: 'featured', label: 'Destacados' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'rating', label: 'Mejor valorados' },
    { value: 'newest', label: 'Más nuevos' },
  ];

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe(products => {
      this.allProducts = products;
      this.loading = false;
      this.route.queryParams.subscribe(params => {
        this.selectedCategory = params['category'] || '';
        this.searchQuery = params['q'] || '';
        this.activeFilter = params['filter'] || '';
        this.applyFilters();
      });
    });
  }

  applyFilters(): void {
    let result = [...this.allProducts];

    if (this.selectedCategory) {
      result = result.filter(p => p.category === this.selectedCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (this.activeFilter === 'sale') result = result.filter(p => p.originalPrice);
    if (this.activeFilter === 'new') result = result.filter(p => p.badge === 'new');
    result = result.filter(p => p.price <= this.currentMax);

    switch (this.selectedSort) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'newest': result.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0)); break;
    }

    this.filteredProducts = result;
  }

  setCategory(slug: string): void {
    this.selectedCategory = slug;
    this.applyFilters();
  }

  setSort(value: string): void {
    this.selectedSort = value;
    this.applyFilters();
  }

  get pageTitle(): string {
    if (this.searchQuery) return `Resultados para "${this.searchQuery}"`;
    if (this.selectedCategory) return this.categories.find(c => c.slug === this.selectedCategory)?.label || 'Productos';
    if (this.activeFilter === 'sale') return 'Ofertas especiales';
    if (this.activeFilter === 'new') return 'Nuevos productos';
    return 'Todos los productos';
  }
}
