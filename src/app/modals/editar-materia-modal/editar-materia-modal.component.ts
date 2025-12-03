import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MateriasService } from 'src/app/services/materias.service';

@Component({
  selector: 'app-editar-materia-modal',
  templateUrl: './editar-materia-modal.component.html',
  styleUrls: ['./editar-materia-modal.component.scss']
})
export class EditarMateriaModalComponent implements OnInit{
  public materia: any = null;

  constructor(
    private materiasService: MateriasService,
    private dialogRef: MatDialogRef<EditarMateriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ){}

  ngOnInit(): void {
    // Esperamos que `data` incluya { id: number, nombre?: string }
    if (this.data && this.data.materia) {
      this.materia = { ...this.data.materia };
    }
  }

  public cerrar_modal(){
    this.dialogRef.close({ isDelete: false });
  }

  public editarMateria(){
    if (!this.materia) {
      this.dialogRef.close({ isEdit: false });
      return;
    }

    // Llamar al servicio con el payload completo
    this.materiasService.actualizarMateria(this.materia).subscribe(
      (response) => {
        console.log('Materia actualizada:', response);
        this.dialogRef.close({ isEdit: true });
      },
      (error) => {
        console.error('Error al actualizar materia:', error);
        this.dialogRef.close({ isEdit: false });
      }
    );
  }

}

