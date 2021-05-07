<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/OP-Banana/ibmcow/">
    <img src="http://www.ouhk.edu.hk/PAU/AboutOUHK/University_identity/OUHK-logo.png" alt="Logo" height="80">
  </a>

  <h3 align="center">Express server for restaurants</h3>

  <p align="center">
    COMP S381F 2020/2021 - Server-side Technologies and Cloud Computing - ibmcow
    <br />
    <a href="http://ibmcow.mybluemix.net/"><strong>Web Hosting »</strong></a>
    <br />
    <br />
    <a href="https://drive.google.com/file/d/1a3mdCLXxDOB1jim_anFPDiIPNPAUo2s5/view?usp=sharing">Project Requirements</a>
  </p>
  <p align="center">
    Mini-project: 10/10
  </p>
  <p>
    <h3>IBM Cloud Push</h3>
  
    First time<br>
    us-south

    1. rd /s /q "node_modules"
    2. bx login
    3. bx target --cf
    4. bx cf push -m 128m ibmcow
  </p>
  <p>
    Not first time<br>
    
    1. bx login
    2. bx target --cf
    3. bx cf push -m 128m ibmcow

    Note: Must remove node_modules before deploy, suggest to copy and paste into a folder specifically for IBM deployment.
  </p>
</p>
