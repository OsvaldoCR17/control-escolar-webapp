import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-alumnos-screen',
  templateUrl: './alumnos-screen.component.html',
  styleUrls: ['./alumnos-screen.component.scss']
})
export class AlumnosScreenComponent implements OnInit {

  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_alumnos: any[] = [];
  // Mantenemos una copia de los datos originales para restaurar el orden al quitar el ordenamiento
  private originalAlumnos: DatosUsuario[] = [];

  //Para la tabla
  // Columnas visibles para todos
  tablaBase: string[] = ['matricula', 'nombre', 'email', 'fecha_nacimiento', 'curp', 'rfc', 'edad', 'telefono'];
  // Columnas solo para administradores
  tablaAdmin: string[] = ['editar', 'eliminar'];
  // Columnas activas usadas por la tabla (se calculan según rol)
  desplegarColumnas: string[] = [];
  dataSource = new MatTableDataSource<DatosUsuario>(this.lista_alumnos as DatosUsuario[]);
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    // Filtro personalizado para buscar por id_trabajador, nombre o email
    this.dataSource.filterPredicate = (data: DatosUsuario, filter: string) => {
      const f = filter.trim().toLowerCase();
      const idStr = (data.matricula || '').toString().toLowerCase();
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
        case 'matricula':
          return Number(data.matricula);
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
    public alumnosService: AlumnosService,
    private router: Router,
    private liveAnnouncer: LiveAnnouncer,
    private dialog: MatDialog,
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
    // Establecer columnas visibles según el rol
    this.actualizarColumnas();
    //Obtener alumnos
    this.obtenerAlumnos();
  }

  private actualizarColumnas() {
    const base = Array.isArray(this.tablaBase) ? this.tablaBase.slice() : [];
    if (this.canSeeAdminItems()) {
      this.desplegarColumnas = base.concat(this.tablaAdmin);
    } else {
      this.desplegarColumnas = base;
    }
  }

  // Consumimos el servicio para obtener los alumnos
  //Obtener alumnos
  public obtenerAlumnos() {
    this.alumnosService.obtenerListaAlumnos().subscribe(
      (response) => {
        this.lista_alumnos = response;
        console.log("Lista users: ", this.lista_alumnos);
        if (this.lista_alumnos.length > 0) {
          //Agregar datos del nombre e email
          this.lista_alumnos.forEach(usuario => {
            usuario.first_name = usuario.user.first_name;
            usuario.last_name = usuario.user.last_name;
            usuario.email = usuario.user.email;
          });
          console.log("Alumnos: ", this.lista_alumnos);

          this.dataSource = new MatTableDataSource<DatosUsuario>(this.lista_alumnos as DatosUsuario[]);
          // Guardar el orden original
          this.originalAlumnos = JSON.parse(JSON.stringify(this.lista_alumnos || []));
          // Reasignar paginador y predicado después de reemplazar la fuente de datos
          this.dataSource.paginator = this.paginator;
          this.dataSource.filterPredicate = (data: DatosUsuario, filter: string) => {
            const f = filter.trim().toLowerCase();
            const idStr = (data.matricula || '').toString().toLowerCase();
            const name = ((data.first_name || '') + ' ' + (data.last_name || '')).toLowerCase();
            const email = (data.email || '').toLowerCase();
            return idStr.includes(f) || name.includes(f) || email.includes(f);
          };
          // Reasignar el accessor de ordenamiento y adjuntar el MatSort a la nueva fuente de datos
          this.dataSource.sortingDataAccessor = (data: DatosUsuario, property: string) => {
            switch (property) {
              case 'nombre':
                return ((data.last_name || '') + ' ' + (data.first_name || '')).toLowerCase();
              case 'matricula':
                return Number(data.matricula);
              default:
                return (data as any)[property];
            }
          };
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }
        }
      }, (error) => {
        console.error("Error al obtener la lista de alumnos: ", error);
        alert("No se pudo obtener la lista de alumnos");
      }
    );
  }

  public goEditar(idUser: number) {
    this.router.navigate(["registro-usuarios/alumnos/" + idUser]);
  }

  // Filtro para buscar en la tabla
  public applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  public delete(idUser: number) {
    //Administrador puede eliminar cualquier alumno
        //Alumno solo puede eliminar su propio registro
        const userId = Number(this.facadeService.getUserId());
        if (this.rol === 'administrador' || (this.rol === 'alumno' && userId === idUser)) {
          // Si es administrador o alumno, es decir, cumple la condición, se puede eliminar
          const dialogRef = this.dialog.open(EliminarUserModalComponent, {
            data: {id: idUser, rol: 'alumno'}, //Se pasan valores a través del componente (usar id del elemento)
            height: '250px',
            width: '400px',
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result.isDelete) {
              console.log("Alumno eliminado");
              alert("Alumno eliminado con éxito");
              // Refrescar la lista de alumnos después de la eliminación
              window.location.reload();
            }else{
              alert("Alumno no se ha podido eliminar");
              console.log("No se eliminó el alumno");
            }
          });
        } else {
          alert("No tienes permisos para eliminar este alumno");
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
      this.dataSource.data = (this.originalAlumnos || []).slice();
      this.liveAnnouncer.announce('Ordenamiento limpiado');
      return;
    }

    const sorted = (this.dataSource.data || []).slice().sort((a: DatosUsuario, b: DatosUsuario) => {
      let res = 0;
      if (active === 'matricula') {
        const na = Number(a.matricula || 0);
        const nb = Number(b.matricula || 0);
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
  matricula: number;
  first_name: string;
  last_name: string;
  email: string;
  fecha_nacimiento: string,
  telefono: string,
  rfc: string,
  curp: string,
  edad: number,
}
