import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { AlumnosService } from 'src/app/services/alumnos.service';
import { MaestrosService } from 'src/app/services/maestros.service';

@Component({
  selector: 'app-editar-user-modal',
  templateUrl: './editar-user-modal.component.html',
  styleUrls: ['./editar-user-modal.component.scss']
})
export class EditarUserModalComponent implements OnInit {
  public rol: string = '';
  public userPayload: any = null;

  constructor(
    private administradoresService: AdministradoresService,
    private maestrosService: MaestrosService,
    private alumnosService: AlumnosService,
    private dialogRef: MatDialogRef<EditarUserModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.rol = this.data?.rol || '';
    // Esperamos recibir en data un objeto { user: {...}, rol: 'administrador'|'maestro'|'alumno' }
    if (this.data && this.data.user) {
      this.userPayload = { ...this.data.user };
    }
  }

  public cerrar_modal() {
    this.dialogRef.close({ isEdit: false });
  }

  // Método para ejecutar la actualización según el rol
  public editarUser() {
    if (!this.userPayload) {
      this.dialogRef.close({ isEdit: false });
      return;
    }

    if (this.rol === 'administrador') {
      this.administradoresService.actualizarAdmin(this.userPayload).subscribe(
        (response) => {
          console.log('Administrador actualizado:', response);
          this.dialogRef.close({ isEdit: true });
        },
        (error) => {
          console.error('Error al actualizar administrador:', error);
          this.dialogRef.close({ isEdit: false });
        }
      );
    } else if (this.rol === 'maestro') {
      this.maestrosService.actualizarMaestro(this.userPayload).subscribe(
        (response) => {
          console.log('Maestro actualizado:', response);
          this.dialogRef.close({ isEdit: true });
        },
        (error) => {
          console.error('Error al actualizar maestro:', error);
          this.dialogRef.close({ isEdit: false });
        }
      );
    } else if (this.rol === 'alumno') {
      this.alumnosService.actualizarAlumno(this.userPayload).subscribe(
        (response) => {
          console.log('Alumno actualizado:', response);
          this.dialogRef.close({ isEdit: true });
        },
        (error) => {
          console.error('Error al actualizar alumno:', error);
          this.dialogRef.close({ isEdit: false });
        }
      );
    } else {
      // Rol desconocido
      console.error('Rol desconocido en EditarUserModal:', this.rol);
      this.dialogRef.close({ isEdit: false });
    }
  }
}
