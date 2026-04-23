import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminBanner } from '../../../models/admin.model';
import { BannersAdminService } from '../services/banners-admin.service';

interface BannerForm {
  id: number | null;
  type: AdminBanner['type'];
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  position: number;
  validFrom: string;
  validTo: string;
}

const EMPTY_FORM = (): BannerForm => ({
  id: null, type: 'hero', title: '', subtitle: '', imageUrl: '',
  ctaText: '', ctaLink: '/products', bgColor: '#7c3aed', textColor: '#ffffff',
  isActive: true, position: 1, validFrom: '', validTo: '',
});

@Component({
  selector: 'admin-banners-section',
  templateUrl: './banners-section.component.html',
  styleUrls: ['./banners-section.component.scss']
})
export class BannersSectionComponent implements OnInit {
  banners!: Observable<AdminBanner[]>;
  constructor(private svc: BannersAdminService) {}

  bannerList: AdminBanner[] = [];
  showModal = false;
  isEdit = false;
  form: BannerForm = EMPTY_FORM();
  showDeleteConfirm = false;
  deletingBanner: AdminBanner | null = null;
  filterType: AdminBanner['type'] | 'all' = 'all';

  readonly types: { value: AdminBanner['type']; label: string; icon: string }[] = [
    { value: 'hero',  label: 'Hero',        icon: '🖼️' },
    { value: 'promo', label: 'Promo bar',   icon: '📢' },
    { value: 'popup', label: 'Pop-up',      icon: '🔔' },
  ];

  readonly typeColors: Record<string, [string, string]> = {
    hero:  ['#ede9fe', '#7c3aed'],
    promo: ['#d1fae5', '#059669'],
    popup: ['#fef3c7', '#92400e'],
  };

  ngOnInit(): void {
    this.banners = this.svc.getBanners();
    this.banners.subscribe(b => this.bannerList = b);
  }

  get filtered(): AdminBanner[] {
    return this.filterType === 'all' ? this.bannerList : this.bannerList.filter(b => b.type === this.filterType);
  }

  typeCount(t: AdminBanner['type']): number { return this.bannerList.filter(b => b.type === t).length; }
  activeCount(): number { return this.bannerList.filter(b => b.isActive).length; }

  openCreate(): void { this.form = EMPTY_FORM(); this.isEdit = false; this.showModal = true; }

  openEdit(b: AdminBanner): void {
    this.form = {
      id: b.id, type: b.type, title: b.title, subtitle: b.subtitle,
      imageUrl: b.imageUrl, ctaText: b.ctaText, ctaLink: b.ctaLink,
      bgColor: b.bgColor, textColor: b.textColor, isActive: b.isActive,
      position: b.position, validFrom: b.validFrom ?? '', validTo: b.validTo ?? '',
    };
    this.isEdit = true;
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  onImageFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.form.imageUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  get isFormValid(): boolean { return !!(this.form.title && this.form.ctaText && this.form.ctaLink); }

  saveBanner(): void {
    if (!this.isFormValid) return;
    const payload: Omit<AdminBanner, 'id'> = {
      type: this.form.type, title: this.form.title, subtitle: this.form.subtitle,
      imageUrl: this.form.imageUrl, ctaText: this.form.ctaText, ctaLink: this.form.ctaLink,
      bgColor: this.form.bgColor, textColor: this.form.textColor,
      isActive: this.form.isActive, position: this.form.position,
      validFrom: this.form.validFrom || undefined,
      validTo:   this.form.validTo   || undefined,
    };
    if (this.isEdit && this.form.id) {
      this.svc.update(this.form.id, payload);
    } else {
      this.svc.add(payload);
    }
    this.closeModal();
  }

  toggleActive(b: AdminBanner): void { this.svc.toggleActive(b.id); }
  confirmDelete(b: AdminBanner): void { this.deletingBanner = b; this.showDeleteConfirm = true; }
  cancelDelete(): void { this.deletingBanner = null; this.showDeleteConfirm = false; }
  doDelete(): void { if (this.deletingBanner) this.svc.remove(this.deletingBanner.id); this.cancelDelete(); }

  typeLabel(type: AdminBanner['type']): string {
    return this.types.find(t => t.value === type)?.label ?? type;
  }
  typeColor(type: AdminBanner['type']): [string, string] {
    return this.typeColors[type] ?? ['#f1f5f9', '#64748b'];
  }
}
