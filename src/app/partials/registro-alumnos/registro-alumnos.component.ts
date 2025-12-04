import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { FacadeService } from 'src/app/services/facade.service';
import { MatDialog } from '@angular/material/dialog';
import { EditarUserModalComponent } from 'src/app/modals/editar-user-modal/editar-user-modal.component';

@Component({
  selector: 'app-registro-alumnos',
  templateUrl: './registro-alumnos.component.html',
  styleUrls: ['./registro-alumnos.component.scss']
})
export class RegistroAlumnosComponent implements OnInit {

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  public alumno:any= {};
  public token: string = "";
  public errors:any={};
  public editar:boolean = false;
  public idUser: Number = 0;

  constructor(
    private router: Router,
    private location : Location,
    public activatedRoute: ActivatedRoute,
    private facadeService: FacadeService,
    private alumnosService: AlumnosService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    //El primer if valida si existe un parámetro en la URL
    if(this.activatedRoute.snapshot.params['id'] != undefined){
      this.editar = true;
      this.idUser = this.activatedRoute.snapshot.params['id'];
      console.log("ID User: ", this.idUser);
      //Al iniciar la vista obtiene el alumno por su ID
      this.alumno = this.datos_user;
    }else{
      this.alumno = this.alumnosService.esquemaAlumno();
      // Rol del usuario
      this.alumno.rol = this.rol;
      this.token = this.facadeService.getSessionToken();
    }
    console.log("Datos alumno: ", this.alumno);
  }

  public regresar(){
    this.location.back();
  }

  public registrar(){
    // Lógica para registrar un nuevo alumno
    //Validaciones del formulario
    this.errors = {};
    this.errors = this.alumnosService.validarAlumno(this.alumno, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    //Se verifica que las contraseñas coincidan
    if(this.alumno.password != this.alumno.confirmar_password){
      alert("Las contraseñas no coinciden");
      return false;
    }
    // Si pasa todas las validaciones se registra el alumno
    this.alumnosService.registrarAlumno(this.alumno).subscribe({
      next: (response:any) => {
        //Aquí va la ejecución del servicio si todo es correcto
        alert('Alumno registrado con éxito');
        console.log("Alumno registrado",response);

        //Validar si se registro que entonces navegue a la lista de alumnos
        if(this.token != ""){
          this.router.navigate(['alumnos']);
        }else{
          this.router.navigate(['/']);
        }
      },
      error: (error:any) => {
        if(error.status === 422){
          this.errors = error.error.errors;
        } else {
          alert('Error al registrar el alumno');
        }
      }
    });
  }

  public actualizar(){
    // Lógica para actualizar los datos de un alumno existente
    // Validación de los datos
    this.errors = {};
    this.errors = this.alumnosService.validarAlumno(this.alumno, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    // Abrir modal que realizará la actualización (usar el objeto del formulario directamente)
    const dialogRef = this.dialog.open(EditarUserModalComponent, {
      width: '600px',
      data: { user: this.alumno, rol: 'alumno' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isEdit) {
        alert('Alumno actualizado exitosamente');
        this.router.navigate(['alumnos']);
      }
    });
  }

  //Funciones para password
  showPassword()
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

  showPwdConfirmar()
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

  //Función para detectar el cambio de fecha
  public changeFecha(event :any){
    console.log(event);
    console.log(event.value.toISOString());

    this.alumno.fecha_nacimiento = event.value.toISOString().split("T")[0];
    console.log("Fecha: ", this.alumno.fecha_nacimiento);
  }

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
