package com.supermarket.billing.service;

import com.supermarket.billing.dto.ProductDTO;
import com.supermarket.billing.entity.Category;
import com.supermarket.billing.entity.MovementType;
import com.supermarket.billing.entity.Product;
import com.supermarket.billing.entity.StockMovement;
import com.supermarket.billing.entity.User;
import com.supermarket.billing.exception.BadRequestException;
import com.supermarket.billing.exception.ResourceNotFoundException;
import com.supermarket.billing.repository.CategoryRepository;
import com.supermarket.billing.repository.ProductRepository;
import com.supermarket.billing.repository.StockMovementRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockMovementRepository stockMovementRepository;
    private final AuthService authService;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          StockMovementRepository stockMovementRepository,
                          AuthService authService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.authService = authService;
    }

    public Page<ProductDTO> getProducts(String query, Long categoryId, Boolean active, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Product> productPage = productRepository.searchProducts(
                (query != null && !query.trim().isEmpty()) ? query.trim() : null,
                categoryId,
                active,
                pageRequest
        );
        return productPage.map(this::mapToDTO);
    }

    public List<ProductDTO> searchForPOS(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        return productRepository.searchForPOS(keyword.trim()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        return mapToDTO(product);
    }

    public ProductDTO getProductByBarcode(String barcode) {
        Product product = productRepository.findByBarcode(barcode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with Barcode: " + barcode));
        return mapToDTO(product);
    }

    public List<ProductDTO> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductDTO createProduct(ProductDTO dto) {
        if (productRepository.existsBySku(dto.getSku().trim())) {
            throw new BadRequestException("Product with SKU '" + dto.getSku() + "' already exists");
        }
        if (productRepository.existsByBarcode(dto.getBarcode().trim())) {
            throw new BadRequestException("Product with Barcode '" + dto.getBarcode() + "' already exists");
        }

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + dto.getCategoryId()));

        Product product = new Product();
        product.setName(dto.getName().trim());
        product.setSku(dto.getSku().trim().toUpperCase());
        product.setBarcode(dto.getBarcode().trim());
        product.setCategory(category);
        product.setCostPrice(dto.getCostPrice());
        product.setUnitPrice(dto.getUnitPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setMinStockLevel(dto.getMinStockLevel());
        product.setMeasurementUnit(dto.getMeasurementUnit());
        product.setTaxRate(dto.getTaxRate());
        product.setActive(dto.isActive());

        Product saved = productRepository.save(product);

        // Record initial stock movement if quantity > 0
        if (dto.getStockQuantity() > 0) {
            User currentUser = authService.getCurrentAuthenticatedUser();
            StockMovement movement = new StockMovement(
                    saved,
                    MovementType.PURCHASE_RESTOCK,
                    dto.getStockQuantity(),
                    0,
                    dto.getStockQuantity(),
                    "INITIAL_STOCK",
                    "Initial product stock entry",
                    currentUser
            );
            stockMovementRepository.save(movement);
        }

        return mapToDTO(saved);
    }

    @Transactional
    public ProductDTO updateProduct(Long id, ProductDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        if (!product.getSku().equalsIgnoreCase(dto.getSku().trim()) &&
                productRepository.existsBySku(dto.getSku().trim())) {
            throw new BadRequestException("Product with SKU '" + dto.getSku() + "' already exists");
        }

        if (!product.getBarcode().equalsIgnoreCase(dto.getBarcode().trim()) &&
                productRepository.existsByBarcode(dto.getBarcode().trim())) {
            throw new BadRequestException("Product with Barcode '" + dto.getBarcode() + "' already exists");
        }

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + dto.getCategoryId()));

        product.setName(dto.getName().trim());
        product.setSku(dto.getSku().trim().toUpperCase());
        product.setBarcode(dto.getBarcode().trim());
        product.setCategory(category);
        product.setCostPrice(dto.getCostPrice());
        product.setUnitPrice(dto.getUnitPrice());
        product.setMinStockLevel(dto.getMinStockLevel());
        product.setMeasurementUnit(dto.getMeasurementUnit());
        product.setTaxRate(dto.getTaxRate());
        product.setActive(dto.isActive());

        return mapToDTO(productRepository.save(product));
    }

    @Transactional
    public void toggleProductStatus(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        product.setActive(!product.isActive());
        productRepository.save(product);
    }

    public ProductDTO mapToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setSku(product.getSku());
        dto.setBarcode(product.getBarcode());
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
        }
        dto.setCostPrice(product.getCostPrice());
        dto.setUnitPrice(product.getUnitPrice());
        dto.setStockQuantity(product.getStockQuantity());
        dto.setMinStockLevel(product.getMinStockLevel());
        dto.setMeasurementUnit(product.getMeasurementUnit());
        dto.setTaxRate(product.getTaxRate());
        dto.setActive(product.isActive());
        dto.setLowStock(product.isLowStock());
        return dto;
    }
}
