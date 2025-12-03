import { Component, OnInit, ViewChild } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { EliminarMateriaModalComponent } from 'src/app/modals/eliminar-materia-modal/eliminar-materia-modal.component';
import { FacadeService } from 'src/app/services/facade.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { MateriasService } from 'src/app/services/materias.service';

@Component({
  selector: 'app-materias-screen',
  templateUrl: './materias-screen.component.html',
  styleUrls: ['./materias-screen.component.scss']
})
export class MateriasScreenComponent implements OnInit{

  public name_user: string = "";
  public nombre_materia: string = "";
  public token: string = "";
  public rol: string = "";
  public lista_materias: any[] = [];
  public listaMaestros: any[] = [];
  public maestrosMap: Map<number,string> = new Map();

  // Para la tabla
  // Columnas para todos los roles
  tablaBase: string[] = ['nrc', 'nombre_materia', 'seccion', 'dias', 'hora_inicio', 'hora_fin', 'salon', 'programa_educativo', 'profesor_asignado', 'creditos'];
  // Columnas solo para administradores
  tablaAdmin: string[] = ['editar', 'eliminar'];
  // Columnas activas usadas por la tabla
  desplegarColumnas: string[] = [];
  dataSource = new MatTableDataSource<DatosMateria>(this.lista_materias as DatosMateria[]);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  lista_maestros: any;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    // Filtro personalizado para buscar por nrc, nombre_materia
    this.dataSource.filterPredicate = (data: DatosMateria, filter: string) => {
      const f = filter.trim().toLowerCase();
      const nrcStr = (data.nrc || '').toString().toLowerCase();
      const nombre = (data.nombre_materia || '').toLowerCase();
      // Buscar solo por NRC y nombre de la materia
      return nrcStr.includes(f) || nombre.includes(f);
    }


    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  constructor(
    public facadeService: FacadeService,
    public materiasService: MateriasService,
    public maestrosService: MaestrosService,
    private router: Router,
    private dialog: MatDialog,
    private liveAnnouncer: LiveAnnouncer,
  ) { }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    this.token = this.facadeService.getSessionToken();

    // Establecer columnas visibles según el rol
    this.actualizarColumnas();

    this.obtenerMaterias();
    this.obtenerMaestros();
  }

  private actualizarColumnas() {
    const base = Array.isArray(this.tablaBase) ? this.tablaBase.slice() : [];
    if (this.canSeeAdminItems()) {
      this.desplegarColumnas = base.concat(this.tablaAdmin);
    } else {
      this.desplegarColumnas = base;
    }
  }

  public goEditar(idMateria: number) {
    this.router.navigate(["registro-materias/" + idMateria]);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Servicio para obtener la lista de materias
  obtenerMaterias() {
    this.materiasService.obtenerListaMaterias().subscribe(
      (response) => {
        this.lista_materias = response;
        console.log('Lista materias: ', this.lista_materias);
        if (this.lista_materias && this.lista_materias.length > 0) {
          // Si es necesario normalizar propiedades para la tabla, hacerlo aquí
          this.lista_materias.forEach(m => {
            if (Array.isArray(m.dias_json)) m.dias_json = m.dias_json.join(', ');
          });

          // Crear nueva fuente de datos y mantener copia original
          this.dataSource = new MatTableDataSource<DatosMateria>(this.lista_materias as DatosMateria[]);
          // Guardar el orden original
          (this as any).originalMaterias = JSON.parse(JSON.stringify(this.lista_materias || []));
          // Mapear nombre del profesor si ya tenemos la lista de maestros
          this.mapProfesorNombres();
          // Reasignar paginador y predicado después de reemplazar la fuente de datos
          this.dataSource.paginator = this.paginator;
          this.dataSource.filterPredicate = (data: DatosMateria, filter: string) => {
            const f = filter.trim().toLowerCase();
            const nrcStr = (data.nrc || '').toString().toLowerCase();
            const nombre = (data.nombre_materia || '').toLowerCase();
            // Filtrar únicamente por NRC y nombre de la materia
            return nrcStr.includes(f) || nombre.includes(f);
          };
          // Reasignar el accessor de ordenamiento si necesitas ordenar por campos específicos
          this.dataSource.sortingDataAccessor = (data: DatosMateria, property: string) => {
            // Permitir ordenamiento consistente por NRC (numérico) y por nombre (alfabético)
            switch (property) {
              case 'nrc':
                return Number((data as any).nrc) || 0;
              case 'nombre_materia':
                return (data.nombre_materia || '').toLowerCase();
              default:
                // Para cualquier otra columna, devolver el valor crudo (no se esperan headers de ordenamiento ahí)
                return (data as any)[property];
            }
          };
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        } else {
          // Si no hay materias, limpiar la fuente
          this.dataSource.data = [];
        }
      },
      (error) => {
        console.error('Error al obtener la lista de materias:', error);
      }
    );
  }

  // Consumimos el servicio para obtener los maestros
    //Obtener maestros
    public obtenerMaestros() {
      this.maestrosService.obtenerListaMaestros().subscribe(
        (response) => {
          this.lista_maestros = response;
          console.log("Lista users: ", this.lista_maestros);
          if (this.lista_maestros.length > 0) {
            //Agregar datos del nombre e email
            this.lista_maestros.forEach(usuario => {
              usuario.first_name = usuario.user.first_name;
              usuario.last_name = usuario.user.last_name;
            });
            console.log("Maestros: ", this.lista_maestros);
            // Mapear la lista para el mat-select: { value: id, nombre: 'Nombre Apellido' }
            this.listaMaestros = this.lista_maestros.map(usuario => ({
              value: usuario.id || usuario.id_trabajador,
              nombre: ((usuario.first_name || '') + ' ' + (usuario.last_name || '')).trim()
            }));

            // Construir mapa id->nombre para uso en la tabla de materias
            this.maestrosMap.clear();
            this.lista_maestros.forEach(usuario => {
              const id = usuario.id || usuario.id_trabajador || (usuario.user && usuario.user.id);
              const nombre = ((usuario.first_name || '') + ' ' + (usuario.last_name || '')).trim();
              if (id !== undefined) this.maestrosMap.set(Number(id), nombre || 'Sin nombre');
            });

            // Si ya hay materias cargadas, mapear nombres
            if (this.lista_materias && this.lista_materias.length) this.mapProfesorNombres();
          }
        }, (error) => {
          console.error("Error al obtener la lista de maestros: ", error);
          alert("No se pudo obtener la lista de maestros");
        }
      );
    }

  private mapProfesorNombres(){
    if(!this.lista_materias || !this.maestrosMap) return;
    this.lista_materias.forEach(mat => {
      const pid = Number(mat.profesor_asignado);
      mat.profesor_nombre = this.maestrosMap.get(pid) || mat.profesor_nombre || 'Sin asignar';
    });
    if(this.dataSource) this.dataSource.data = this.lista_materias;
  }

  public delete(idMateria: number) {
     // Administrador puede eliminar cualquier materia
      if (this.rol === 'administrador') {
        const dialogRef = this.dialog.open(EliminarMateriaModalComponent, {
          data: {id: idMateria}, //Se pasan valores a través del componente (usar id del elemento)
          height: '250px',
          width: '400px',
        });
        dialogRef.afterClosed().subscribe(result => {
          if(result.isDelete) {
            console.log("Materia eliminada");
            alert("Materia eliminada con éxito");
            // Refrescar la lista de materias después de la eliminación
            window.location.reload();
          }else{
            alert("La materia no se ha podido eliminar");
            console.log("No se eliminó la materia");
          }
        });
      } else {
        alert("No tienes permisos para eliminar esta materia");
      }

  }

  announceSortChange(sortState: Sort) {
      const active = sortState.active;
      const dir = sortState.direction;

      if (!active || dir === '') {
        // Restaurar el orden original si existe
        const original = (this as any).originalMaterias || null;
        if (original && Array.isArray(original)) {
          this.dataSource.data = (original as any[]).slice();
        }
        try { this.liveAnnouncer.announce('Ordenamiento limpiado'); } catch (e) { /* no-op if announcer unavailable */ }
        return;
      }

      // Realizar ordenamiento usando el accessor configurado (si existe)
      const data = (this.dataSource.data || []).slice();
      const accessor = (this.dataSource.sortingDataAccessor && this.dataSource.sortingDataAccessor.bind(this.dataSource)) ||
        ((row: any, prop: string) => (row as any)[prop]);

      data.sort((a: any, b: any) => {
        let aVal = accessor(a, active);
        let bVal = accessor(b, active);

        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        const aNum = Number(aVal);
        const bNum = Number(bVal);
        let cmp = 0;
        if (!isNaN(aNum) && !isNaN(bNum)) {
          cmp = aNum - bNum;
        } else {
          cmp = aVal.toString().localeCompare(bVal.toString(), undefined, { numeric: true, sensitivity: 'base' });
        }

        return (dir === 'asc' ? 1 : -1) * (cmp === 0 ? 0 : (cmp > 0 ? 1 : -1));
      });

      this.dataSource.data = data;
      try { this.liveAnnouncer.announce(`Ordenado por ${active} ${dir === 'asc' ? 'ascendente' : 'descendente'}`); } catch (e) { }
  }

  isAdmin(): boolean {
    return this.rol === 'administrador';
  }

  canSeeAdminItems(): boolean {
      return this.isAdmin();
  }
}
export interface DatosMateria {
  id: number;
  nrc: number;
  nombre_materia: string;
  seccion: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  salon: string;
  programa_educativo: string;
  profesor_asignado: string;
}

export interface DatosUsuario {
  id: number;
  first_name: string;
  last_name: string;
}
