import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product, Category } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {

  private products: Product[] = [
    {
      id: 1, name: 'Colgate Optic White Blanqueadora', description: 'Pasta dentífrica blanqueadora con flúor activo. Elimina manchas superficiales visibles en 3 días y protege contra caries.',
      price: 3.99, originalPrice: 5.49,
      images: ['https://images.unsplash.com/photo-1559163499-413811fb2344?w=500&q=80', 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&q=80'],
      category: 'oral-care', brand: 'Colgate', rating: 4.7, reviews: 2145, stock: 80, badge: 'bestseller',
      tags: ['blanqueador', 'flúor', 'anticaries'], sku: 'COL-OW-100', volume: '75ml'
    },
    {
      id: 2, name: 'Oral-B Pro 750 Cepillo Eléctrico', description: 'Cepillo eléctrico con tecnología rotatoria-oscilante. Temporizador de 2 minutos y cabezal de recambio incluido. Elimina hasta 80% más de placa.',
      price: 34.99, originalPrice: 49.99,
      images: ['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&q=80', 'https://images.unsplash.com/photo-1559163499-413811fb2344?w=500&q=80'],
      category: 'oral-care', brand: 'Oral-B', rating: 4.8, reviews: 3201, stock: 45, badge: 'sale',
      tags: ['eléctrico', 'placa', 'timer'], sku: 'ORB-PRO750'
    },
    {
      id: 3, name: 'CeraVe Crema Hidratante Facial', description: 'Crema facial no comedogénica con ceramidas y ácido hialurónico. Restaura la barrera cutánea y retiene la hidratación. Ideal para piel seca y sensible.',
      price: 14.99, originalPrice: 18.99,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80'],
      category: 'skincare', brand: 'CeraVe', rating: 4.9, reviews: 5432, stock: 60, badge: 'bestseller',
      tags: ['ceramidas', 'hidratante', 'piel sensible'], sku: 'CVE-CREMA-F', volume: '52ml',
      certifications: ['dermatológicamente testado', 'sin fragancia', 'sin parabenos']
    },
    {
      id: 4, name: 'La Roche-Posay Effaclar Sérum', description: 'Sérum anti-imperfecciones con ácido salicílico al 0.5% y niacinamida. Reduce puntos negros y poros dilatados visiblemente en 4 semanas.',
      price: 29.99, originalPrice: 36.99,
      images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500&q=80'],
      category: 'skincare', brand: 'La Roche-Posay', rating: 4.7, reviews: 1876, stock: 35, badge: 'hot',
      tags: ['sérum', 'poros', 'acné'], sku: 'LRP-EFF-SER', volume: '30ml',
      certifications: ['dermatológicamente testado', 'sin parabenos']
    },
    {
      id: 5, name: 'Dove Jabón Hidratante Original', description: 'Pastilla de jabón con ¼ de crema hidratante. Limpia en profundidad sin resecar la piel. Apto para uso diario en cara y cuerpo.',
      price: 1.99, originalPrice: 2.79,
      images: ['https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=500&q=80', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80'],
      category: 'body-care', brand: 'Dove', rating: 4.6, reviews: 8912, stock: 120, badge: 'sale',
      tags: ['jabón', 'hidratante', 'piel seca'], sku: 'DOV-JAB-ORI', volume: '100g'
    },
    {
      id: 6, name: 'Garnier Fructis Champú Reparador', description: 'Champú con aceite de aguacate y manteca de karité para cabello dañado o quebradizo. Repara la fibra capilar desde el primer lavado.',
      price: 4.99, originalPrice: 6.49,
      images: ['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&q=80'],
      category: 'hair-care', brand: 'Garnier', rating: 4.5, reviews: 3421, stock: 70, badge: 'new',
      tags: ['aguacate', 'reparador', 'cabello dañado'], sku: 'GAR-FRU-REP', volume: '400ml'
    },
    {
      id: 7, name: "L'Oréal Revitalift Crema Antiedad", description: 'Crema de día con Pro-Retinol y filtro solar SPF 30. Hidrata, reafirma y atenúa las arrugas visiblemente. Resultados visibles en 4 semanas.',
      price: 19.99, originalPrice: 26.99,
      images: ['https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500&q=80', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&q=80'],
      category: 'skincare', brand: "L'Oréal", rating: 4.6, reviews: 2341, stock: 40, badge: 'sale',
      tags: ['antiedad', 'retinol', 'SPF 30'], sku: 'LOR-RVL-DAY', volume: '50ml',
      certifications: ['dermatológicamente testado']
    },
    {
      id: 8, name: 'Listerine Zero Enjuague Bucal', description: 'Enjuague bucal sin alcohol con sabor menta suave. Elimina el 99.9% de las bacterias causantes de caries y proporciona aliento fresco durante 12 horas.',
      price: 4.49,
      images: ['https://images.unsplash.com/photo-1609587312208-cea54be969e7?w=500&q=80', 'https://images.unsplash.com/photo-1588776814546-1ffedbe47425?w=500&q=80'],
      category: 'oral-care', brand: 'Listerine', rating: 4.7, reviews: 1654, stock: 55, badge: 'new',
      tags: ['sin alcohol', 'bacterias', 'aliento fresco'], sku: 'LST-ZERO-500', volume: '500ml'
    },
    {
      id: 9, name: 'Nivea Crema Corporal Clásica', description: 'La crema corporal original en lata con extracto de aceite de Eucerit. Proporciona hidratación intensa y duradera por hasta 48 horas.',
      price: 3.99, originalPrice: 5.29,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80', 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=500&q=80'],
      category: 'body-care', brand: 'Nivea', rating: 4.8, reviews: 12453, stock: 90, badge: 'bestseller',
      tags: ['hidratante', '48 horas', 'piel seca'], sku: 'NIV-BOD-250', volume: '250ml'
    },
    {
      id: 10, name: 'Pantene Pro-V Acondicionador Hidratación', description: 'Acondicionador con Pro-Vitamina B5 y biotina. Desenreda, suaviza y aporta brillo al cabello apagado y sin vida desde la primera aplicación.',
      price: 5.49, originalPrice: 7.49,
      images: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&q=80', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500&q=80'],
      category: 'hair-care', brand: 'Pantene', rating: 4.5, reviews: 2876, stock: 65, badge: 'sale',
      tags: ['pro-vitamina B5', 'hidratante', 'brillo'], sku: 'PAN-PRV-ACD', volume: '385ml'
    },
    {
      id: 11, name: 'Maybelline Fit Me Base Fluida', description: 'Base de maquillaje de cobertura natural con ácido hialurónico. Acabado natural y luminoso. Disponible en 40 tonos para todo tipo de piel.',
      price: 12.99, originalPrice: 15.99,
      images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80', 'https://images.unsplash.com/photo-1583241475880-083f84372725?w=500&q=80'],
      category: 'makeup', brand: 'Maybelline', rating: 4.6, reviews: 4231, stock: 50, badge: 'hot',
      tags: ['cobertura natural', 'ácido hialurónico', 'larga duración'], sku: 'MAY-FME-BASE', volume: '30ml',
      certifications: ['dermatológicamente testado', 'sin parabenos']
    },
    {
      id: 12, name: 'Axe Dark Temptation Body Spray', description: 'Desodorante body spray con fragancia a chocolate oscuro y madera. Protección antitranspirante de larga duración con efecto seco inmediato.',
      price: 3.49, originalPrice: 4.99,
      images: ['https://images.unsplash.com/photo-1541643600914-78b084683702?w=500&q=80', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&q=80'],
      category: 'fragrances', brand: 'Axe', rating: 4.4, reviews: 7654, stock: 100, badge: 'sale',
      tags: ['desodorante', 'larga duración', 'fragancia'], sku: 'AXE-DT-150', volume: '150ml'
    }
  ];

  private categories: Category[] = [
    { id: 1, name: 'Higiene Oral', slug: 'oral-care', icon: 'smile', count: 38 },
    { id: 2, name: 'Cuidado de Piel', slug: 'skincare', icon: 'droplet', count: 52 },
    { id: 3, name: 'Cuidado Corporal', slug: 'body-care', icon: 'shield', count: 45 },
    { id: 4, name: 'Cuidado Capilar', slug: 'hair-care', icon: 'scissors', count: 31 },
    { id: 5, name: 'Maquillaje', slug: 'makeup', icon: 'star', count: 64 },
    { id: 6, name: 'Fragancias', slug: 'fragrances', icon: 'wind', count: 27 },
    { id: 7, name: 'Cuidado Bebé', slug: 'baby', icon: 'heart', count: 19 },
  ];

  getProducts(): Observable<Product[]> {
    return of(this.products);
  }

  getProductById(id: number): Observable<Product | undefined> {
    return of(this.products.find(p => p.id === id));
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return of(this.products.filter(p => p.category === category));
  }

  getFeaturedProducts(): Observable<Product[]> {
    return of(this.products.filter(p => p.badge === 'hot' || p.badge === 'bestseller'));
  }

  getSaleProducts(): Observable<Product[]> {
    return of(this.products.filter(p => p.originalPrice));
  }

  getCategories(): Observable<Category[]> {
    return of(this.categories);
  }

  searchProducts(query: string): Observable<Product[]> {
    const q = query.toLowerCase();
    return of(this.products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    ));
  }

  addProduct(product: Omit<Product, 'id'>): void {
    const id = Math.max(0, ...this.products.map(p => p.id)) + 1;
    this.products.push({ ...product, id });
  }

  updateProduct(id: number, updates: Partial<Product>): void {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx > -1) this.products[idx] = { ...this.products[idx], ...updates };
  }

  deleteProduct(id: number): void {
    this.products = this.products.filter(p => p.id !== id);
  }
}
