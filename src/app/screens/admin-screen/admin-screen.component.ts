import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { FacadeService } from 'src/app/services/facade.service';
import { EliminarUserModalComponent } from 'src/app/modals/eliminar-user-modal/eliminar-user-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-screen',
  templateUrl: './admin-screen.component.html',
  styleUrls: ['./admin-screen.component.scss']
})
export class AdminScreenComponent implements OnInit{

  public name_user:string = "";
  public rol:string = "";
  public token:string = "";
  public lista_admins:any[]= [];

  constructor(
    public facadeService: FacadeService,
    private administradoresService: AdministradoresService,
    private router: Router,
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

    // Obtenemos los administradores
    this.obtenerAdmins();
  }

  //Obtener lista de usuarios
  public obtenerAdmins() {
    this.administradoresService.obtenerListaAdmins().subscribe(
      (response) => {
        this.lista_admins = response;
        console.log("Lista users: ", this.lista_admins);
      }, (error) => {
        alert("No se pudo obtener la lista de administradores");
      }
    );
  }

  public goEditar(idUser: number) {
    this.router.navigate(["registro-usuarios/administrador/" + idUser]);
  }

  public delete(idUser: number) {
        //Administrador solo puede eliminar su propio registro
        const userId = Number(this.facadeService.getUserId());
        if (this.rol === 'administrador') {
          // Si es administrador, es decir, cumple la condición, se puede eliminar
          const dialogRef = this.dialog.open(EliminarUserModalComponent, {
            data: {id: idUser, rol: 'administrador'}, //Se pasan valores a través del componente (usar id del elemento)
            height: '250px',
            width: '400px',
          });
          dialogRef.afterClosed().subscribe(result => {
            if(result.isDelete) {
              console.log("Administrador eliminado");
              alert("Administrador eliminado con éxito");
              // Refrescar la lista de administradores después de la eliminación
              window.location.reload();
            }else{
              alert("Administrador no se ha podido eliminar");
              console.log("No se eliminó el administrador");
            }
          });
        } else {
          alert("No tienes permisos para eliminar este administrador");
        }
  }

}
