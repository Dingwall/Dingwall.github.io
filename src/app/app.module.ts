import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { TopNavComponent } from './top-nav/top-nav.component';
import { FooterComponent } from './footer/footer.component';
import { SkumpComponent } from './pages/skump/skump.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RunningComponent } from './pages/running/running.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MarkdownModule } from 'ngx-markdown';
import { HttpClientModule } from '@angular/common/http';
import { ProjectwyvernComponent } from './pages/projectwyvern/projectwyvern.component';
import { ProjectCardComponent } from './pages/projects/project-card/project-card.component';
import { WoodworkingComponent } from './pages/woodworking/woodworking.component'
import { WoodProjectCardComponent } from './pages/woodworking/wood-project-card/wood-project-card.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    TopNavComponent,
    FooterComponent,
    SkumpComponent,
    RunningComponent,
    ProjectsComponent,
    ProjectwyvernComponent,
    ProjectCardComponent,
    WoodworkingComponent,
    WoodProjectCardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatButtonModule,
    HttpClientModule,
    FlexLayoutModule,
    MarkdownModule.forRoot({ loader: HttpClientModule }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
