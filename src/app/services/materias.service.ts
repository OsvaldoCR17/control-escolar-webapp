import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FacadeService } from './facade.service';
import { ErrorsService } from './tools/errors.service';
import { ValidatorService } from './tools/validator.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class MateriasService {

  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private facadeService: FacadeService
  ) { }

  public esquemaMateria(){
    return {
      'nrc': '',
      'nombre_materia': '',
      'seccion': '',
      'dias_json': [],
      'hora_inicio': '',
      'hora_fin': '',
      'salon': '',
      'programa_educativo': '',
      'profesor_asignado': '',
      'creditos': '',
    }
  }

  //Validación para el formulario
  public validarMateria(data: any, editar: boolean){
    console.log("Validando materia... ", data);
    let error: any = [];

    if(!this.validatorService.required(data["nrc"])){
      error["nrc"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["nombre_materia"])){
      error["nombre_materia"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["seccion"])){
      error["seccion"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["dias_json"])){
      error["dias_json"] = "Debes seleccionar días para poder registrar la materia.";
    }

    if(!this.validatorService.required(data["hora_inicio"])){
      error["hora_inicio"] = "Debes seleccionar horario de inicio para poder registrar la materia.";
    }
    if(!this.validatorService.required(data["hora_fin"])){
      error["hora_fin"] = "Debes seleccionar horario de fin para poder registrar la materia.";
    }

    // Validación adicional: la clase debe durar exactamente 2 horas (120 minutos)
    // Se verifica primero si vienen campos separados 'hora_inicio' y 'hora_fin'
    if (this.validatorService.required(data['hora_inicio']) && this.validatorService.required(data['hora_fin'])) {
      const parseMinutes = (t: string): number | null => {
        if (!t) return null;
        t = (t || '').toString().trim();
        // Soporta formatos "HH:mm" (24h) y "hh:mm AM/PM"
        const ampm = t.match(/^(\d{1,2}:\d{2})\s*([AaPp][Mm])$/);
        if (ampm) {
          const time = ampm[1];
          const mod = ampm[2].toLowerCase();
          const parts = time.split(':').map(Number);
          let h = parts[0];
          const m = parts[1] || 0;
          if (mod === 'pm' && h < 12) h += 12;
          if (mod === 'am' && h === 12) h = 0;
          return h * 60 + m;
        }
        const parts = t.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return parts[0] * 60 + parts[1];
        }
        return null;
      };

      const start = parseMinutes(data['hora_inicio']);
      const end = parseMinutes(data['hora_fin']);
      const MIN_ALLOWED = 7 * 60; // 07:00 AM
      const MAX_ALLOWED = 21 * 60; // 09:00 PM

      if (start === null || end === null) {
        error['hora_inicio'] = 'Formato de hora inválido.';
      } else if (start >= end) {
        error['hora_inicio'] = 'La hora de inicio debe ser menor que la hora de fin.';
      } else if (start < MIN_ALLOWED || end > MAX_ALLOWED) {
        error['hora_inicio'] = 'El horario debe estar entre 07:00 AM y 07:00 PM.';
      } else if ((end - start) !== 120) {
        error['hora_inicio'] = 'La duración de la clase debe ser de 2 horas.';
      }
      if (start === null || end === null) {
        error['hora_fin'] = 'Formato de hora inválido.';
      } else if (start >= end) {
        error['hora_fin'] = 'La hora de fin debe ser mayor que la hora de inicio.';
      } else if (start < MIN_ALLOWED || end > MAX_ALLOWED) {
        error['hora_fin'] = 'El horario debe estar entre 09:00 AM y 09:00 PM.';
      } else if ((end - start) !== 120) {
        error['hora_fin'] = 'La duración de la clase debe ser de 2 horas.';
      }

    // Si no vienen campos separados, intentar parsear campo 'horario' si tiene formato 'HH:MM - HH:MM'
    }

    if(!this.validatorService.required(data["salon"])){
      error["salon"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["programa_educativo"])){
      error["programa_educativo"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["profesor_asignado"])){
      error["profesor_asignado"] = this.errorService.required;
    }

    if(!this.validatorService.required(data["creditos"])){
      error["creditos"] = this.errorService.required;
    } else {
      // Validar que no supere 10 créditos
      const cr = Number(data['creditos']);
      if (isNaN(cr) || cr <= 0) {
        error["creditos"] = 'Ingresa una cantidad de créditos válida.';
      } else if (cr > 10) {
        error["creditos"] = 'La cantidad de créditos no puede ser mayor a 10.';
      }
    }
    //Return arreglo
    return error;
  }

  //Aquí van los servicios para materias
  //Servicio para registrar una nueva materia
  public registrarMateria (data: any): Observable <any>{
    //Verificar si existe un token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.post<any>(`${environment.url_api}/materias/`, data, { headers });
  }

  //Servicio para obtener la lista de maestros
    public obtenerListaMaestros(): Observable<any>{
      // Verificamos si existe el token de sesión
      const token = this.facadeService.getSessionToken();
      let headers: HttpHeaders;
      if (token) {
        headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
      } else {
        headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      }
      return this.http.get<any>(`${environment.url_api}/lista-maestros/`, { headers });
    }

  public obtenerListaMaterias(): Observable<any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.get<any>(`${environment.url_api}/lista-materias/`, { headers });
  }

  //Petición para obtener una materia por su ID
  public obtenerMateriaPorID(idMateria: number): Observable<any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.get<any>(`${environment.url_api}/materias/?id=${idMateria}`, { headers });
  }

  //Petición para actualizar una materia
  public actualizarMateria(data: any): Observable<any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return this.http.put<any>(`${environment.url_api}/materias/?`, data, { headers });
  }

  //Petición para eliminar una materia
  public eliminarMateria(idMateria: number): Observable<any>{
    // Verificamos si existe el token de sesión
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.delete<any>(`${environment.url_api}/materias/?id=${idMateria}`, { headers });
  }


}
