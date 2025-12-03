import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EditarMateriaModalComponent } from 'src/app/modals/editar-materia-modal/editar-materia-modal.component';
import { Location } from '@angular/common';
import { FacadeService } from 'src/app/services/facade.service';
import { MateriasService } from 'src/app/services/materias.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-registro-materias',
  templateUrl: './registro-materias.component.html',
  styleUrls: ['./registro-materias.component.scss']
})
export class RegistroMateriasComponent implements OnInit {

  public tipo : string = "registro-materias";
  public materia:any = {};
  public errors:any = {};
  public editar: boolean = false;
  public token: string = "";
  public idUser: number = 0;

  //Para el select
  public programa: any[] = [
    {value: '1', viewValue: 'Licenciatura en Ciencias de la Computación'},
    {value: '2', viewValue: 'Ingeniería en Ciencias de la Computación'},
    {value: '3', viewValue: 'Ingeniería en Tecnologías de la Información'},
  ];

  public dias: any[] = [
    {value: '1', nombre: 'Lunes'},
    {value: '2', nombre: 'Martes'},
    {value: '3', nombre: 'Miércoles'},
    {value: '4', nombre: 'Jueves'},
    {value: '5', nombre: 'Viernes'},
  ];

  // Lista que será poblada desde el servicio
  public listaMaestros: any[] = [];
  public tpMin: DateTime;
  public tpMax: DateTime;
  name_user: string;
  rol: string;
  lista_maestros: any;
  dataSource: any;
  originalMaestros: any;
  paginator: any;
  sort: any;

  constructor(
    private router : Router,
    private activatedRoute: ActivatedRoute,
    private location : Location,
    public facadeService: FacadeService,
    private materiasService: MateriasService,
    private maestrosService: MaestrosService,
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

    // Inicializar límites para timepicker (07:00 AM - 09:00 PM)
    this.tpMin = DateTime.fromFormat('07:00 AM', 'hh:mm a');
    this.tpMax = DateTime.fromFormat('09:00 PM', 'hh:mm a');

    // Asegurar que el array de días exista para evitar errores al hacer push
    this.materia.dias_json = this.materia.dias_json || [];
    //Obtener maestros
    this.obtenerMaestros();

    // Si la ruta contiene un id, estamos en modo edición: obtener la materia
    const routeId = this.activatedRoute.snapshot.params['id'];
    if (routeId !== undefined && routeId !== null && routeId !== '') {
      this.editar = true;
      this.idUser = Number(routeId);
      this.obtenerMateriaByID(this.idUser);
    }
  }

  public regresar(){
    this.location.back();
  }

  public goBack(){
    this.location.back();
  }

  public registrar(){
    // Lógica para registrar una nueva materia
    //Validaciones del formulario
    this.errors = {};
    this.errors = this.materiasService.validarMateria(this.materia, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    // Si pasa todas las validaciones se registra la materia
    const payload: any = { ...this.materia };
    // Normalizar horas a 24h antes de enviar
    payload.hora_inicio = this.convertirHora12a24(payload.hora_inicio);
    payload.hora_fin = this.convertirHora12a24(payload.hora_fin);

    this.materiasService.registrarMateria(payload).subscribe({
      next: (response:any) => {
        //Aquí va la ejecución del servicio si todo es correcto
        alert('Materia registrada con éxito');
        console.log("Materia registrada",response);
        //Validar si se registro que entonces navegue a la lista de materias
        if(this.token != ""){
          this.router.navigate(['materias']);
        }else{
          this.router.navigate(['/']);
        }
      },
      error: (error:any) => {
        if(error.status === 422){
          this.errors = error.error.errors;
        } else {
          alert('Error al registrar la materia');
        }
      }
    });
  }

  public actualizar(){
    // Lógica para actualizar los datos de una materia existente
    this.errors = {};
    this.errors = this.materiasService.validarMateria(this.materia, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }
    // Si pasa todas las validaciones abrimos el modal de confirmación/edición
    // Normalizar horas a 24h antes de abrir el modal (mutamos el objeto del formulario)
    this.materia.hora_inicio = this.convertirHora12a24(this.materia.hora_inicio);
    this.materia.hora_fin = this.convertirHora12a24(this.materia.hora_fin);

    const dialogRef = this.dialog.open(EditarMateriaModalComponent, {
      width: '600px',
      data: { materia: this.materia }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.isEdit) {
        // Actualización realizada dentro del modal
        alert('Materia actualizada exitosamente');
        this.router.navigate(['materias']);
      } else {
        // no se editó o se canceló
      }
    });
  }

  public changeHoraInicio(event:any){
    console.log("Hora inicio seleccionada: ", event);
    this.materia.hora_inicio = this.convertirHora12a24(event);
    console.log("Hora inicio en 24h: ", this.materia.hora_inicio);
  }

  public changeHoraFin(event:any){
    console.log("Hora fin seleccionada: ", event);
    this.materia.hora_fin = this.convertirHora12a24(event);
    console.log("Hora fin en 24h: ", this.materia.hora_fin);
  }

  public convertirHora12a24(hora12: string): string {
    if (!hora12) return '';
    const s = hora12.toString().trim();
    // Formato 12h: e.g. '07:00 AM' o '7:00 pm'
    const m = s.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (m) {
      let h = Number(m[1]);
      const min = Number(m[2]);
      const mod = m[3].toLowerCase();
      if (mod === 'pm' && h < 12) h += 12;
      if (mod === 'am' && h === 12) h = 0;
      const hh = h < 10 ? '0' + h : h.toString();
      const mm = min < 10 ? '0' + min : min.toString();
      return `${hh}:${mm}`;
    }
    // Formato 24h: 'HH:MM' o 'H:MM'
    const m2 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m2) {
      let h = Number(m2[1]);
      const min = Number(m2[2]);
      h = Math.max(0, Math.min(23, h));
      const hh = h < 10 ? '0' + h : h.toString();
      const mm = min < 10 ? '0' + min : min.toString();
      return `${hh}:${mm}`;
    }
    // Si no reconocemos el formato, devolver original (backend fallará si es inválido)
    return s;
  }

  public convertirHora24a12(hora24: string): string {
    if (!hora24) return '';
    let [hours, minutes] = hora24.split(':').map(Number);
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = hours < 10 ? '0' + hours : hours.toString();
    const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
    return `${hoursStr}:${minutesStr} ${modifier}`;
  }

  // Funciones para los checkbox
  public checkboxChange(event:any){
    console.log("Evento: ", event);
    if(event.checked){
      this.materia.dias_json.push(event.source.value);
    }else{
      console.log(event.source.value);
      this.materia.dias_json.forEach((dia, i) => {
        if(dia == event.source.value){
          this.materia.dias_json.splice(i,1)
        }
      });
    }
    console.log("Array materias: ", this.materia);
  }

  public revisarSeleccion(nombre: string){
    if(this.materia.dias_json){
      var busqueda = this.materia.dias_json.find((element)=>element==nombre);
      if(busqueda != undefined){
        return true;
      }else{
        return false;
      }
    }else{
      return false;
    }
  }

  //Obtener materias por ID
  public obtenerMateriaByID(id: number){
    this.materiasService.obtenerMateriaPorID(id).subscribe(
      (response) => {
        // Normalizar la respuesta para manejar distintas formas del API
        console.log("Materia obtenida (raw): ", response);
        const m: any = response || {};
        // Mapear propiedades conocidas con fallback
        this.materia.id = m.id || m.id_materia || this.materia.id;
        this.materia.nrc = m.nrc || m.codigo || this.materia.nrc;
        this.materia.nombre_materia = m.nombre_materia || m.nombre || this.materia.nombre_materia;
        this.materia.seccion = m.seccion || this.materia.seccion;
        // Dias: aceptar array o string CSV
        if (Array.isArray(m.dias_json)) {
          this.materia.dias_json = m.dias_json.slice();
        } else if (typeof m.dias_json === 'string') {
          this.materia.dias_json = m.dias_json.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else if (Array.isArray(m.dias)) {
          this.materia.dias_json = m.dias.slice();
        } else if (typeof m.dias === 'string') {
          this.materia.dias_json = m.dias.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else {
          this.materia.dias_json = this.materia.dias_json || [];
        }

        // Horarios: aceptar tanto hora en 24h como objetos anidados
        const horaInicioRaw = m.hora_inicio || m.horaInicio || (m.horario && m.horario.hora_inicio) || this.materia.hora_inicio;
        const horaFinRaw = m.hora_fin || m.horaFin || (m.horario && m.horario.hora_fin) || this.materia.hora_fin;
        this.materia.hora_inicio = this.convertirHora24a12(horaInicioRaw);
        this.materia.hora_fin = this.convertirHora24a12(horaFinRaw);

        // Profesor asignado: puede venir como id o como objeto
        if (m.profesor_asignado) {
          if (typeof m.profesor_asignado === 'object') {
            // intentar extraer id o user
            this.materia.profesor_asignado = m.profesor_asignado.id || m.profesor_asignado.id_trabajador || (m.profesor_asignado.user && m.profesor_asignado.user.id) || this.materia.profesor_asignado;
          } else {
            this.materia.profesor_asignado = m.profesor_asignado;
          }
        } else if (m.profesor) {
          this.materia.profesor_asignado = m.profesor.id || m.profesor.id_trabajador || this.materia.profesor_asignado;
        }

        // Otros campos directos
        this.materia.salon = m.salon || this.materia.salon;
        this.materia.programa_educativo = m.programa_educativo || m.programa || this.materia.programa_educativo;
        this.materia.creditos = m.creditos || this.materia.creditos;

        // Asegurar que dias_json esté inicializado
        this.materia.dias_json = this.materia.dias_json || [];
        // Marcar edición
        this.editar = true;
        console.log("Materia normalizada: ", this.materia);
      },
      (error) => {
        console.error('Error al obtener la materia:', error);
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
          }
        }, (error) => {
          console.error("Error al obtener la lista de maestros: ", error);
          alert("No se pudo obtener la lista de maestros");
        }
      );
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


}


