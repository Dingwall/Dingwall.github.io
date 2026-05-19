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
import { IntervalComponent } from './pages/interval/interval.component';
import { FellowshipComponent } from './pages/fellowship/fellowship.component';
import { GroupListComponent } from './pages/fellowship/group-list/group-list.component';
import { GroupDashboardComponent } from './pages/fellowship/group-dashboard/group-dashboard.component';
import { AuthLoginComponent } from './pages/fellowship/auth/auth-login.component';
import { AuthSignupComponent } from './pages/fellowship/auth/auth-signup.component';
import { AccountEditComponent } from './pages/fellowship/account/account-edit.component';
import { GroupSettingsComponent } from './pages/fellowship/group-settings/group-settings.component';
import { GetNameFromIdPipe } from './pipes/get-name-from-id.pipe';

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
    IntervalComponent,
    FellowshipComponent,
    GroupListComponent,
    GroupDashboardComponent,
    AuthLoginComponent,
    AuthSignupComponent,
    AccountEditComponent,
    GroupSettingsComponent,
    GetNameFromIdPipe,
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
