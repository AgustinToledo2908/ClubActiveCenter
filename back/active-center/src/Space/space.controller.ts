import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  InternalServerErrorException,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  Query,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SpaceService } from './space.service';
import { Space } from 'src/Entities/Space.entity';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/User/UserDTO/Role.enum';
import { RolesGuard } from 'src/Auth/Guard/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSpaceDto } from './dto/create-space.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';

@Controller('space')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @Get('allSpaces')
  @SetMetadata('isPublic', true)
  @ApiOperation({
    summary: 'Obtener espacios.',
    description: 'Este endpoint trae todos los espacios, paginados.',
  })
  async getSpaces(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<Space[]> {
    try {
      const pageNumber = page || 1;
      const limitNumber = limit || 5;
      return await this.spaceService.getAllSpace(pageNumber, limitNumber);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los espacios.',
        error.message || error,
      );
    }
  }

  @Post('create')
  @Roles(Role.admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Agregar espacio. (ADMIN)',
    description:
      'Este endpoint permite agregar un espacio, solo para administradores.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título de la actividad',
          example: 'Clase de Yoga Matutina',
        },
        maxPeople: {
          type: 'number',
          description:
            'Número máximo de personas que pueden participar en la actividad',
          example: 20,
        },
        date: {
          type: 'string',
          format: 'date',
          description: 'Fecha en la que se realizará la actividad',
          example: '2025-02-10',
        },
        hour: {
          type: 'string',
          pattern: '^(?:[01]\\d|2[0-3]):[0-5]\\d$',
          description: 'Hora en la cual se va a realizar la actividad',
          example: '14:30',
        },
        description: {
          type: 'string',
          description: 'Descripción de la actividad',
          example: 'Clase de yoga para principiantes en el parque central.',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen de la actividad (JPG, PNG, WEBP, máximo 1.5MB)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async createSpaces(
    @Body() spaces: CreateSpaceDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1500000,
            message: 'El tamaño máximo es 1.5 MB',
          }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.spaceService.createSpaces(spaces, file);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener un espacio id',
    description:
      'Este endpoint recibe un id y se encarga de buscar el espacio.',
  })
  getSpaceById(@Param('id', ParseUUIDPipe) id: string) {
    return this.spaceService.getSpaceById(id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener un espacio por nombre',
    description:
      'Este endpoint se encarga de recibir un nombre y buscar un espacio.',
  })
  getSpaceByName(@Body() name: string) {
    return this.spaceService.getSpaceByName(name);
  }
}
