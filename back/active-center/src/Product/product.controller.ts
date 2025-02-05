import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  InternalServerErrorException,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Product } from 'src/Entities/Product.entity';
import { CreateProductDto, ProductFilters } from './productDTO/product.dto';
import { ProductService } from './product.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/User/UserDTO/Role.enum';
import { RolesGuard } from 'src/Auth/Guard/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Products')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @SetMetadata('isPublic', true)
  async getProduct(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('name') name?: string,
    @Query('category') category?: string,
    @Query('stock') stock?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    try {
      const pageNumber = page ? parseInt(page) : 1;
      const limitNumber = limit ? parseInt(limit) : 5;

      const filters: ProductFilters = {
        name,
        category,
        stock,
        minPrice,
        maxPrice,
      };

      return await this.productService.getProduct(
        pageNumber,
        limitNumber,
        filters,
      );
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los productos.',
        error.message || error,
      );
    }
  }



@Post('create')
@Roles(Role.admin)
@UseGuards(RolesGuard)
@ApiBearerAuth()
@UseInterceptors(FileInterceptor('file'))
async createProduct(
  @Body() product: CreateProductDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 1500000, message: 'El tamaño máximo es 1.5 MB' }),
        new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
      ],
    })
  ) 
  file?: Express.Multer.File,
) {
  return this.productService.createProduct(product, file);
}


  @Get(':id')
  @SetMetadata('isPublic', true)
  async getProductById(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const product = await this.productService.getProductById(id);
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }
      return product;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener el producto.',
        error.message || error,
      );
    }
  }

  @Put(':id')
  @Roles(Role.admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  async updateProductById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() product: Product,
  ) {
    try {
      const updatedProduct = await this.productService.updateProductById(
        id,
        product,
      );
      if (!updatedProduct) {
        throw new NotFoundException('Producto no encontrado');
      }
      return updatedProduct;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al actualizar el producto.',
        error.message || error,
      );
    }
  }

  @Delete(':id')
  @Roles(Role.admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  async isRetired(@Param('id', ParseUUIDPipe) id: string) {
    return await this.productService.isRetired(id);
  }
}
