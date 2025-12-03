import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MateriasService } from 'src/app/services/materias.service';

@Component({
  selector: 'app-eliminar-materia-modal',
  templateUrl: './eliminar-materia-modal.component.html',
  styleUrls: ['./eliminar-materia-modal.component.scss']
})
export class EliminarMateriaModalComponent implements OnInit{

  public materiaId: number | null = null;

  constructor(
    private materiasService: MateriasService,
    private dialogRef: MatDialogRef<EliminarMateriaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ){}

  ngOnInit(): void {
    // Esperamos que `data` incluya { id: number, nombre?: string }
    if (this.data && this.data.id !== undefined) {
      this.materiaId = Number(this.data.id);
    }
  }

  public cerrar_modal(){
    this.dialogRef.close({ isDelete: false });
  }

  public eliminarMateria(){
    if (this.materiaId === null) {
      this.dialogRef.close({ isDelete: false });
      return;
    }

    this.materiasService.eliminarMateria(this.materiaId).subscribe(
      (response) => {
        console.log('Materia eliminada:', response);
        this.dialogRef.close({ isDelete: true });
      },
      (error) => {
        console.error('Error al eliminar materia:', error);
        this.dialogRef.close({ isDelete: false });
      }
    );
  }

}
