import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { ProjectwyvernComponent } from './pages/projectwyvern/projectwyvern.component';
import { RunningComponent } from './pages/running/running.component';
import { WoodworkingComponent } from './pages/woodworking/woodworking.component';
import { SkumpComponent } from './pages/skump/skump.component';

const routes: Routes = [
  { path : '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'skump', component: SkumpComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'running', component: RunningComponent },
  { path: 'woodworking', component: WoodworkingComponent },
  { path: 'projectwyvern', component: ProjectwyvernComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes,
    {
        useHash: true
    }
  )],
  exports: [RouterModule]
})
export class AppRoutingModule { }
