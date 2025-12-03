import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import DatalabelsPlugin from 'chartjs-plugin-datalabels';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { MateriasService } from 'src/app/services/materias.service';


@Component({
  selector: 'app-graficas-screens',
  templateUrl: './graficas-screens.component.html',
  styleUrls: ['./graficas-screens.component.scss']
})
export class GraficasScreenComponent implements OnInit{

  //Agregar chartjs-plugin-datalabels
  //Variables
  public total_user: any = {};

  //Histograma
  lineChartData = {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie"],
    datasets: [
      {
        data:[0, 0, 0, 0, 0],
        label: 'Registro de materias',
        backgroundColor: '#F88406'
      }
    ]
  }
  lineChartOption = {
    responsive:false
  }
  lineChartPlugins = [ DatalabelsPlugin ];

  //Barras
  barChartData = {
    labels: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
    datasets: [
      {
        data:[0, 0, 0, 0, 0],
        label: 'Registro de materias',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#82D3FB',
          '#FB82F5',
          '#2AD84A'
        ]
      }
    ]
  }
  barChartOption = {
    responsive:false
  }
  barChartPlugins = [ DatalabelsPlugin ];

  //Circular
  pieChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        label: 'Registro de usuarios',
        backgroundColor: [
          '#FCFF44',
          '#F1C8F2',
          '#31E731'
        ]
      }
    ]
  }
  pieChartOption = {
    responsive:false
  }
  pieChartPlugins = [ DatalabelsPlugin ];

  //Dona - Doughnut
  doughnutChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        label: 'Registro de usuarios',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#31E7E7'
        ]
      }
    ]
  }
  doughnutChartOption = {
    responsive:false
  }
  doughnutChartPlugins = [ DatalabelsPlugin ];

  constructor(
    private administradoresServices: AdministradoresService,
    private materiasService: MateriasService
  ) { }

  ngOnInit(): void {
    this.obtenerTotalUsers();
    this.obtenerDiasCounts();
  }

  // Lista fija de días
  public dias: any[] = [
    { value: '1', nombre: 'Lunes' },
    { value: '2', nombre: 'Martes' },
    { value: '3', nombre: 'Miércoles' },
    { value: '4', nombre: 'Jueves' },
    { value: '5', nombre: 'Viernes' },
  ];

  // Obtener conteo de materias por día y actualizar gráficas (linea y barras)
  public obtenerDiasCounts() {
    // índices
    const counts = new Array(this.dias.length).fill(0);
    this.materiasService.obtenerListaMaterias().subscribe(
      (response) => {
        const lista = response || [];
        lista.forEach((m: any) => {
          // dias_json
          let dias: string[] = [];
          if (Array.isArray(m.dias_json)) {
            dias = m.dias_json.map((d: any) => String(d || ''));
          } else if (typeof m.dias_json === 'string') {
            dias = m.dias_json.split(',').map((x: string) => x.trim()).filter(Boolean);
          } else if (m.dias) {
            dias = String(m.dias).split(',').map((x: string) => x.trim()).filter(Boolean);
          }

          dias.forEach(d => {
            const token = String(d || '').trim().toLowerCase();
            // búsqueda exacta por nombre de día en la lista `dias`
            let idx = this.dias.findIndex(dd => (dd.nombre || '').toString().trim().toLowerCase() === token);
            // si no se encontró, buscar por inicio de cadena)
            if (idx === -1) {
              idx = this.dias.findIndex(dd => (dd.nombre || '').toString().trim().toLowerCase().startsWith(token));
            }
            if (idx >= 0 && idx < counts.length) counts[idx]++;
          });
        });

        // Actualizar lineChartData (histograma) y barChartData con los conteos
        if (this.lineChartData && this.lineChartData.datasets && this.lineChartData.datasets.length > 0) {
          this.lineChartData = {
            ...this.lineChartData,
            datasets: [ { ...this.lineChartData.datasets[0], data: counts } ]
          };
        }

        if (this.barChartData && this.barChartData.datasets && this.barChartData.datasets.length > 0) {
          this.barChartData = {
            ...this.barChartData,
            datasets: [ { ...this.barChartData.datasets[0], data: counts } ]
          };
        }
      }, (error) => {
        console.error('Error al obtener materias para conteo de días:', error);
      }
    );
  }

  // Función para obtener el total de usuarios registrados
  public obtenerTotalUsers(){
    this.administradoresServices.getTotalUsuarios().subscribe(
      (response)=>{
        this.total_user = response || {};
        console.log("Total usuarios (backend): ", this.total_user);

        // Extraer totales con fallback
        const admins = Number(this.total_user.admins ?? this.total_user.admin ?? 0) || 0;
        const maestros = Number(this.total_user.maestros ?? this.total_user.maestro ?? this.total_user.maestro_count ?? 0) || 0;
        const alumnos = Number(this.total_user.alumnos ?? this.total_user.alumno ?? this.total_user.alumno_count ?? 0) || 0;

        // Circular (pie)
        if (this.pieChartData && this.pieChartData.datasets && this.pieChartData.datasets.length > 0) {
          this.pieChartData = {
            ...this.pieChartData,
            datasets: [
              { ...this.pieChartData.datasets[0], data: [admins, maestros, alumnos] }
            ]
          };
        }

        // Dona (doughnut)
        if (this.doughnutChartData && this.doughnutChartData.datasets && this.doughnutChartData.datasets.length > 0) {
          this.doughnutChartData = {
            ...this.doughnutChartData,
            datasets: [
              { ...this.doughnutChartData.datasets[0], data: [admins, maestros, alumnos] }
            ]
          };
        }

        // Histograma (linea)
        if (this.lineChartData && this.lineChartData.datasets && this.lineChartData.datasets.length > 0) {
          const total = admins + maestros + alumnos;
          this.lineChartData = {
            ...this.lineChartData,
            datasets: [ { ...this.lineChartData.datasets[0], data: this.lineChartData.labels.map(() => total) } ]
          };
        }
      }, (error)=>{
        console.log("Error al obtener total de usuarios ", error);

        alert("No se pudo obtener el total de cada rol de usuarios");
      }
    );
  }

}
