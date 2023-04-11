/*********************************************************************************
 *  WEB700 – Assignment 05
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Oussama Issam Ferjani __ Student ID: 171852213 __ Date: 03/05/2023 ________
 *
 *  Online (Cycliic) Link: https://crowded-pocketbook-duck.cyclic.app ______________
 *
 ********************************************************************************/

var HTTP_PORT = process.env.PORT || 8080;
const express = require("express");
const app = express();
const cd = require("./modules/collegeData.js");
const path = require("path");
const exphbs = require("express-handlebars");

// add the app.engine() code using exphbs.engine
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute
            ? ' class="nav-item active" '
            : ' class="nav-item" ') +
          '><a class="nav-link" href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
    },
  })
);

// set the view engine using app.set()
app.set("view engine", "hbs");

// fix the Navigation Bar to Show the correct "active" item
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  next();
});

// add the express.urlencoded() middleware with the extended option set to true
app.use(express.urlencoded({ extended: true }));

// identify our newly created "public" folder as a source for static files
app.use(express.static("public"));

// add a new student GET
app.get("/students/add", (req, res) => {
  cd.getCourses()
    .then((data) => {
      res.render("addStudent", { courses: data });
    })
    .catch((err) => {
      console.log(err);
      res.render("addStudent", { courses: [] });
    });
});

// form to add a new student POST
app.post("/students/add", (req, res) => {
  // get the student data from the request body
  const studentData = req.body;
  // call the addStudent() function from collegeData module
  cd.addStudent(studentData)
    .then(() => {
      // redirect to the /students route upon successful addition
      res.redirect("/students");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

// home path
app.get("/", (req, res) => {
  res.render("home");
});

// about path
app.get("/about", (req, res) => {
  res.render("about");
});

// HTML DEMO path
app.get("/htmlDemo", (req, res) => {
  res.render("htmlDemo");
});

// students path
app.get("/students", async (req, res) => {
  try {
    if (req.query.course) {
      const course = parseInt(req.query.course);
      if (isNaN(course) || course < 1 || course > 7) {
        throw new Error("Invalid course number");
      }
      const students = await cd.getStudentsByCourse(course);
      res.render("students", { students });
    } else {
      const students = await cd.getAllStudents();
      res.render("students", { students });
    }
  } catch (err) {
    res.render("students", { message: "no results" });
  }
});

// TAs path
app.get("/tas", async (req, res) => {
  try {
    const managers = await cd.getTAs();
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: "no results" });
  }
});

// courses path
app.get("/courses", async (req, res) => {
  try {
    const courses = await cd.getCourses();
    res.render("courses", { courses });
  } catch (err) {
    res.render("courses", { message: "no results" });
  }
});

// single course path

app.get("/course/:Cid", async (req, res) => {
  try {
    const num = parseInt(req.params.Cid);
    const course = await cd.getCourseById(num);
    res.render("course", { course: course });
  } catch (err) {
    res.render("course", { message: "no results" });
  }
});

// specific student path
app.get("/student/:studentNum", (req, res) => {
  // initialize an empty object to store the values
  let viewData = {};

  cd.getStudentByNum(req.params.studentNum)
    .then((cd) => {
      if (cd) {
        viewData.student = cd; //store student data in the "viewData" object as "student"
      } else {
        viewData.student = null; // set student to null if none were returned
      }
    })
    .catch(() => {
      viewData.student = null; // set student to null if there was an error
    })
    .then(cd.getCourses)
    .then((cd) => {
      viewData.courses = cd; // store course data in the "viewData" object as "courses"

      // loop through viewData.courses and once we have found the courseId that matches
      // the student's "course" value, add a "selected" property to the matching
      // viewData.courses object

      for (let i = 0; i < viewData.courses.length; i++) {
        if (viewData.courses[i].courseId == viewData.student.course) {
          viewData.courses[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.courses = []; // set courses to empty if there was an error
    })
    .then(() => {
      if (viewData.student == null) {
        // if no student - return an error
        res.status(404).send("Student Not Found");
      } else {
        res.render("student", { viewData: viewData }); // render the "student" view
      }
    });
});

// student form POST update
app.post("/student/update", async (req, res) => {
  const updatedStudent = req.body;
  await cd
    .updateStudent(updatedStudent)
    .then(() => res.redirect("/students"))
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update student");
    });
});

app.get("/student/delete/:studentNum", async (req, res) => {
  const studentNum = req.params.studentNum;

  try {
    await cd.deleteStudentByNum(studentNum);
    res.redirect("/students");
  } catch (error) {
    res.status(500).send("Unable to Remove Student / Student not found");
  }
});

// add a new course GET
app.get("/courses/add", (req, res) => {
  res.render("addCourse");
});

// form to add a new course POST
app.post("/courses/add", (req, res) => {
  // get the course data from the request body
  const courseData = req.body;
  // call the addCourse() function from collegeData module
  cd.addCourse(courseData)
    .then(() => {
      // redirect to the /courses route upon successful addition
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

// update a course POST
app.post("/course/update", (req, res) => {
  // get the course data from the request body
  const courseData = req.body;
  // call the updateCourse() function from collegeData module
  cd.updateCourse(courseData)
    .then(() => {
      // redirect to the /courses route upon successful update
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

// display a course GET
app.get("/course/:id", (req, res) => {
  // get the course id from the request parameter
  const id = req.params.id;
  // call the getCourseById() function from collegeData module
  cd.getCourseById(id)
    .then((course) => {
      if (!course) {
        // if course is undefined, send a 404 error
        res.status(404).send("Course Not Found");
      } else {
        // render the course view with the course data
        res.render("course", { course: course });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

// delete a course GET
app.get("/course/delete/:id", (req, res) => {
  // get the course id from the request parameter
  const id = req.params.id;
  // call the deleteCourseById() function from collegeData module
  cd.deleteCourseById(id)
    .then(() => {
      // redirect to the /courses route upon successful deletion
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Unable to Remove Course / Course not found");
    });
});

// delete a student GET
app.get("/students/delete/:studentNum", (req, res) => {
  // Get the student number from the request parameter
  const studentNum = req.params.studentNum;

  // Call the deleteStudentByNum() function from collegeData module
  cd.deleteStudentByNum(studentNum)
    .then(() => {
      // Redirect to the /students route upon successful deletion
      res.redirect("/students");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Unable to Remove Student / Student not found");
    });
});

// WRONG PATH
app.use(function (req, res, next) {
  res.status(404).send("Page Not Found");
});

// setup http server to listen on HTTP_PORT
cd.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("server listening on port: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.error(`Error initializing data: ${err}`);
  });
