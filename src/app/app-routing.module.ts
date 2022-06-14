import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { RunningComponent } from './pages/running/running.component';
import { SkumpComponent } from './pages/skump/skump.component';

const routes: Routes = [
  { path : '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'skump', component: SkumpComponent },
  { path: 'projects', component: ProjectsComponent },
  { path: 'running', component: RunningComponent },
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
