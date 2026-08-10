import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceViewService } from './service-view.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthUser, CurrentUser, requireOrganisationId } from '@archivision/shared';

@Controller('services')
export class ServiceController {
  constructor(
    private readonly service: ServiceService,
    private readonly viewService: ServiceViewService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(requireOrganisationId(user));
  }

  @Get('generate-vue')
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(requireOrganisationId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, requireOrganisationId(user));
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.update(id, requireOrganisationId(user), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
