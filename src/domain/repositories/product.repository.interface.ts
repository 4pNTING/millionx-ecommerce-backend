import {
  CatalogProductModel,
  CatalogProductPageModel,
  CatalogProductQuery,
  CreateCatalogProductBundleRequest,
  CreateCatalogProductRequest,
  UpdateCatalogProductRequest,
} from '../models/product.model';
import { CatalogVariantModel, CreateCatalogVariantRequest } from '../models/product-variant.model';
import { SetCatalogProductPriceRequest } from '../models/product-price.model';
import {
  AddCatalogProductImageRequest,
  DeleteCatalogProductImageRequest,
  UpdateCatalogProductImageRequest,
} from '../models/product-image.model';

export interface IProductRepository {
  loadProducts(query?: CatalogProductQuery): Promise<CatalogProductPageModel>;
  loadProduct(id?: string, slug?: string, currency?: string): Promise<CatalogProductModel>;
  createProduct(input: CreateCatalogProductRequest): Promise<CatalogProductModel>;
  createProductBundle(input: CreateCatalogProductBundleRequest): Promise<CatalogProductModel>;
  updateProduct(input: UpdateCatalogProductRequest): Promise<CatalogProductModel>;
  createVariant(input: CreateCatalogVariantRequest): Promise<CatalogVariantModel>;
  setPrice(input: SetCatalogProductPriceRequest): Promise<CatalogProductModel>;
  addImage(input: AddCatalogProductImageRequest): Promise<CatalogProductModel>;
  updateImage(input: UpdateCatalogProductImageRequest): Promise<CatalogProductModel>;
  deleteImage(input: DeleteCatalogProductImageRequest): Promise<CatalogProductModel>;
}
