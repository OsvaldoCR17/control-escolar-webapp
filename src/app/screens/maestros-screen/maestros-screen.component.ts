import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-maestros-screen',
  templateUrl: './maestros-screen.component.html',
  styleUrls: ['./maestros-screen.component.scss']
})

export class MaestrosScreenComponent implements OnInit {

  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_maestros: any[] = [];
  // Mantenemos una copia de los datos originales para restaurar el orden al quitar el ordenamiento
  private originalMaestros: DatosUsuario[] = [];

  //Para la tabla
  tablaBase: string[] = ['id_trabajador', 'nombre', 'email', 'fecha_nacimiento', 'telefono', 'rfc', 'cubiculo', 'area_investigacion'];
  tablaAdmin: string[] = ['editar', 'eliminar'];
  // Columnas activas usadas por la tabla
  desplegarColumnas: string[] = [];
  dataSource = new MatTableDataSource<DatosUsuario>(this.lista_maestros as DatosUsuario[]);

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    // Filtro personalizado para buscar por id_trabajador, nombre o email
    this.dataSource.filterPredicate = (data: DatosUsuario, filter: string) => {
      const f = filter.trim().toLowerCase();
      const idStr = (data.id_trabajador || '').toString().toLowerCase();
      const name = ((data.first_name || '') + ' ' + (data.last_name || '')).toLowerCase();
      const email = (data.email || '').toLowerCase();
      return idStr.includes(f) || name.includes(f) || email.includes(f);
    };

    // Sorting accessor personalizado para ordenar por nombre completo
    this.dataSource.sortingDataAccessor = (data: DatosUsuario, property: string) => {
      switch (property) {
        case 'nombre':
          // Ordenar por last_name, luego por first_name
          return ((data.last_name || '') + ' ' + (data.first_name || '')).toLowerCase();
        case 'id_trabajador':
          return Number(data.id_trabajador);
        default:
          // comportamiento predeterminado - convertir a cadena para un ordenamiento estable
          const v = (data as any)[property];
          return v == null ? '' : v.toString().toLowerCase();
      }
    };

    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  constructor(
    public facadeService: FacadeService,
    public maestrosService: MaestrosService,
    private router: Router,
    private dialog: MatDialog,
    private liveAnnouncer: LiveAnnouncer
  ) { }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    //Validar que haya inicio de sesión
    //Obtengo el token del login
    this.token = this.facadeService.getSessionToken();
    console.log("Token: ", this.token);
    if(this.token == ""){
      this.router.navigate(["/"]);
    }
    this.actualizarColumnas();
    //Obtener maestros
    this.obtenerMaestros();
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
            usuario.email = usuario.user.email;
          });
          console.log("Maestros: ", this.lista_maestros);

          this.dataSource = new MatTableDataSource<DatosUsuario>(this.lista_maestros as DatosUsuario[]);
          // Guardar el orden original
          this.originalMaestros = JSON.parse(JSON.stringify(this.lista_maestros || []));
          // Reasignar paginador y predicado después de reemplazar la fuente de datos
          this.dataSource.paginator = this.paginator;
          this.dataSource.filterPredicate = (data: DatosUsuario, filter: string) => {
            const f = filter.trim().toLowerCase();
            const idStr = (data.id_trabajador || '').toString().toLowerCase();
            const name = ((data.first_name || '') + ' ' + (data.last_name || '')).toLowerCase();
            const email = (data.email || '').toLowerCase();
            return idStr.includes(f) || name.includes(f) || email.includes(f);
          };
          // Reasignar el accessor de ordenamiento y adjuntar el MatSort a la nueva fuente de datos
          this.dataSource.sortingDataAccessor = (data: DatosUsuario, property: string) => {
            switch (property) {
              case 'nombre':
                return ((data.last_name || '') + ' ' + (data.first_name || '')).toLowerCase();
              case 'id_trabajador':
                return Number(data.id_trabajador);
              default:
                return (data as any)[property];
            }
          };
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        }
      }, (error) => {
        console.error("Error al obtener la lista de maestros: ", error);
        alert("No se pudo obtener la lista de maestros");
      }
    );
  }

  public goEditar(idUser: number) {
    this.router.navigate(["registro-usuarios/maestros/" + idUser]);
  }

  // Apply a simple text filter for the table
  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public delete(idUser: number) {
    //Administrador puede eliminar cualquier maestro
    //Maestro solo puede eliminar su propio registro
    const userId = Number(this.facadeService.getUserId());
    if (this.rol === 'administrador' || (this.rol === 'maestro' && userId === idUser)) {
      // Si es administrador o maestro, es decir, cumple la condición, se puede eliminar
      const dialogRef = this.dialog.open(EliminarUserModalComponent, {
        data: {id: idUser, rol: 'maestro'}, //Se pasan valores a través del componente (usar id del elemento)
        height: '250px',
        width: '400px',
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result.isDelete) {
          console.log("Maestro eliminado");
          alert("Maestro eliminado con éxito");
          // Refrescar la lista de maestros después de la eliminación
          window.location.reload();
        }else{
          alert("Maestro no se ha podido eliminar");
          console.log("No se eliminó el maestro");
        }
      });
    } else {
      alert("No tienes permisos para eliminar este maestro");
    }
  }

  private actualizarColumnas() {
    const base = Array.isArray(this.tablaBase) ? this.tablaBase.slice() : [];
    if (this.canSeeAdminItems()) {
      this.desplegarColumnas = base.concat(this.tablaAdmin);
    } else {
      this.desplegarColumnas = base;
    }
  }

  /** Accesibilidad: anunciar el cambio en el estado de ordenamiento */
  announceSortChange(sortState: Sort) {
    console.log('matSortChange event:', sortState);
    // Ordenamiento manual para asegurar que la tabla se reordene correctamente al reemplazar los datos
    const active = sortState.active;
    const dir = sortState.direction;

    if (!active || dir === '') {
      // restaurar el orden original
      this.dataSource.data = (this.originalMaestros || []).slice();
      this.liveAnnouncer.announce('Ordenamiento limpiado');
      return;
    }

    const sorted = (this.dataSource.data || []).slice().sort((a: DatosUsuario, b: DatosUsuario) => {
      let res = 0;
      if (active === 'id_trabajador') {
        const na = Number(a.id_trabajador || 0);
        const nb = Number(b.id_trabajador || 0);
        res = na - nb;
      } else if (active === 'nombre') {
        const la = (a.last_name || '').toLowerCase();
        const lb = (b.last_name || '').toLowerCase();
        if (la < lb) res = -1;
        else if (la > lb) res = 1;
        else {
          const fa = (a.first_name || '').toLowerCase();
          const fb = (b.first_name || '').toLowerCase();
          if (fa < fb) res = -1; else if (fa > fb) res = 1; else res = 0;
        }
      } else {
        const va = ((a as any)[active] || '').toString().toLowerCase();
        const vb = ((b as any)[active] || '').toString().toLowerCase();
        if (va < vb) res = -1; else if (va > vb) res = 1; else res = 0;
      }
      return dir === 'asc' ? res : -res;
    });

    this.dataSource.data = sorted;
    this.liveAnnouncer.announce(`Ordenado ${active} en orden ${dir}`);
  }

  isAdmin(): boolean {
    return this.rol === 'administrador';
  }

  canSeeAdminItems(): boolean {
      return this.isAdmin();
  }

}

//Esto va fuera de la llave que cierra la clase
export interface DatosUsuario {
  id: number,
  id_trabajador: number;
  first_name: string;
  last_name: string;
  email: string;
  fecha_nacimiento: string,
  telefono: string,
  rfc: string,
  cubiculo: string,
  area_investigacion: number,
}
