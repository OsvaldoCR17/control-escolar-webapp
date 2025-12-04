import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { FacadeService } from 'src/app/services/facade.service';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { EditarUserModalComponent } from 'src/app/modals/editar-user-modal/editar-user-modal.component';

@Component({
  selector: 'app-registro-admin',
  templateUrl: './registro-admin.component.html',
  styleUrls: ['./registro-admin.component.scss']
})
export class RegistroAdminComponent implements OnInit {

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  public admin:any = {};
  public errors:any = {};
  public editar:boolean = false;
  public token: string = "";
  public idUser: Number = 0;

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  constructor(
    private location: Location,
    public activatedRoute: ActivatedRoute,
    private administradoresService: AdministradoresService,
    private facadeService: FacadeService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    //El primer if valida si existe un parámetro en la URL
    if(this.activatedRoute.snapshot.params['id'] != undefined){
      this.editar = true;
      //Asignamos a nuestra variable global el valor del ID que viene por la URL
      this.idUser = this.activatedRoute.snapshot.params['id'];
      console.log("ID User: ", this.idUser);
      //Al iniciar la vista asignamos los datos del user
      this.admin = this.datos_user;
    }else{
      this.admin = this.administradoresService.esquemaAdmin();
      this.admin.rol = this.rol;
      this.token = this.facadeService.getSessionToken();
    }
    //Imprimir datos en consola
    console.log("Admin: ", this.admin);
  }

  //Funciones para password
  public showPassword()
  {
    if(this.inputType_1 == 'password'){
      this.inputType_1 = 'text';
      this.hide_1 = true;
    }
    else{
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  public showPwdConfirmar()
  {
    if(this.inputType_2 == 'password'){
      this.inputType_2 = 'text';
      this.hide_2 = true;
    }
    else{
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }

  public regresar(){
    this.location.back();
  }

  public registrar(){
    //Validaciones del formulario
    this.errors = {};
    this.errors = this.administradoresService.validarAdmin(this.admin, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    //Se verifica que las contraseñas coincidan
    if(this.admin.password != this.admin.confirmar_password){
      alert("Las contraseñas no coinciden");
      return false;
    }
    // Si pasa todas las validaciones se registra el administrador
    this.administradoresService.registrarAdmin(this.admin).subscribe({
      next: (response:any) => {
        //Aquí va la ejecución del servicio si todo es correcto
        alert('Administrador registrado con éxito');
        console.log("Admin registrado",response);

        //Validar si se registro que entonces navegue a la lista de administradores
        if(this.token != ""){
          this.router.navigate(['administrador']);
        }else{
          this.router.navigate(['/']);
        }
      },
      error: (error:any) => {
        if(error.status === 422){
          this.errors = error.error.errors;
        } else {
          alert('Error al registrar el administrador');
        }
      }
    });
  }

  public actualizar(){
    // Validación de los datos
    this.errors = {};
    this.errors = this.administradoresService.validarAdmin(this.admin, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    // Abrir modal que realizará la actualización (usar el objeto del formulario directamente)
    // Normalizamos cualquier campo si fuera necesario aquí (mantener comportamiento original)
    const dialogRef = this.dialog.open(EditarUserModalComponent, {
      width: '600px',
      data: { user: this.admin, rol: 'administrador' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isEdit) {
        alert('Administrador actualizado exitosamente');
        this.router.navigate(['administrador']);
      }
    });

  }


  // Función para los campos solo de datos alfabeticos
  public soloLetras(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // Permitir solo letras (mayúsculas y minúsculas) y espacio
    if (
      !(charCode >= 65 && charCode <= 90) &&  // Letras mayúsculas
      !(charCode >= 97 && charCode <= 122) && // Letras minúsculas
      charCode !== 32                         // Espacio
    ) {
      event.preventDefault();
    }
  }

  // Solo letras y números (sin caracteres especiales) para CURP y RFC
  public soloLetrasYNumeros(event: KeyboardEvent) {
    const key = event.key;
    // Permitir teclas de control: backspace, tab, enter, delete, arrows
    const controlKeys = ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (controlKeys.includes(key)) {
      return; // no bloquear
    }
    // Bloquear cualquier caracter que NO sea alfanumérico
    if (key.length === 1 && !/^[A-Za-z0-9]$/.test(key)) {
      event.preventDefault();
    }
  }
}
