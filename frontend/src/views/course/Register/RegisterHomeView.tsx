import { Box, Button, CardContent, CircularProgress, Grid, styled, TextField, Typography, Unstable_Grid2 } from "@mui/material"
import axios from "axios"
import config from "config"
import { useEffect, useState } from "react"

import FullScreenGrid from "views/auth/components/FullScreenGrid/FullScreenGrid"
import { observer } from 'mobx-react-lite';
import { useLocation, useParams } from "react-router-dom"
import CourseDescriptionView from "./components/CourseDescriptionView"
import courseStore from "store/course"

interface CourseModel {
    id : string
    title: string
    subtitle: string 
    description: string 
    createdAt: Date
    updatedAt: Date
}

const RegisterHomeView : React.FC = () => {
	const [loading, setLoading] = useState(false)
    let {id} = useParams();
	const [course, setCourse] = useState<CourseModel | null>(null);

    useEffect(() => {
		const getCourse = async () => {
			const course = await courseStore.getCourse(id)
			setCourse(course)
		};
		
		getCourse();

		return () => {
			// cleanup? 
		}
	
    }, []);

    const registerCourse = async (id: string | undefined) => {
		try {
            if(!id){
                throw new Error("Course does not exist!")
            }

            const data = {
                courseId: id
            }
          
			setLoading(true);
            const endpointUrl = config.backend.url + 'courses/' + id + "/users"
			const res = await axios.post(endpointUrl, data)
			//navigate('/');
		}
		catch (e: any) {
			const errorMessage = e?.response?.data?.error?.message
            /* TODO refactor error handling, this could be done better */
            if(e.message){
                alert(e.message)
            } else if (errorMessage){
                alert(errorMessage)
            }
		}
		finally {
			setLoading(false)          
		}
        /* TODO: Force UI to go back to course list view */

	}
	return (

	<FullScreenGrid
			container
			gap={2}
		>
		<Typography
			variant="h4"
		>
			{showCourseTitle(course?.title)}
		</Typography>

		<CourseDescriptionView 
			description={course?.description} 
			title={course?.title}></CourseDescriptionView>
		<Button
			fullWidth
			variant="contained"
			onClick={() => registerCourse(id)}
			disabled={loading}
		>
		 Enroll
		</Button>
	</FullScreenGrid>
	)
}
function showCourseTitle(title: string | undefined){
	if(!title){
		console.log(title)
		return "No title found!"
	}
	else {
		return title
	}
}
export default observer(RegisterHomeView) 